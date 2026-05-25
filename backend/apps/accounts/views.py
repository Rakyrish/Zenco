from django.contrib.auth import authenticate
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow admin login with either username or email."""

    def validate(self, attrs):
        login = attrs.get(self.username_field)
        password = attrs.get('password')
        user = None

        if login and '@' in login:
            user = User.objects.filter(email__iexact=login).first()
        if user is None and login:
            user = User.objects.filter(username__iexact=login).first()

        if user is None:
            raise serializers.ValidationError('No active staff account found with the given credentials.')

        authenticated = authenticate(
            request=self.context.get('request'),
            username=user.get_username(),
            password=password,
        )
        if authenticated is None or not authenticated.is_active or not authenticated.is_staff:
            raise serializers.ValidationError('No active staff account found with the given credentials.')

        self.user = authenticated
        data = super().validate({self.username_field: authenticated.get_username(), 'password': password})
        data.update({
            'username': authenticated.username,
            'email': authenticated.email,
            'full_name': authenticated.get_full_name() or authenticated.username,
        })
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['full_name'] = user.get_full_name() or user.username
        token['role'] = 'admin' if user.is_superuser else 'editor' if getattr(user, 'is_content_manager', False) else 'support'
        return token


class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'last_login', 'is_active', 'date_joined',
        ]
        read_only_fields = ['last_login', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        if getattr(obj, 'is_content_manager', False):
            return 'editor'
        return 'support'


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_content_manager': getattr(user, 'is_content_manager', False),
            'is_sales_rep': getattr(user, 'is_sales_rep', False),
        })


class AdminUserListView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        user = serializer.save()
        user.set_unusable_password()
        user.save(update_fields=['password'])


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
