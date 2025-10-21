from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
# from .models import CustomUser

class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration."""
    username = serializers.CharField(max_length=150, min_length=3)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=30, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=30, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    position = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_username(self, value):
        """Validate username uniqueness."""
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def validate_email(self, value):
        """Validate email uniqueness."""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    def validate_password(self, value):
        """Validate password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField()
    password = serializers.CharField()

# UserSerializer temporarily disabled
# class UserSerializer(serializers.ModelSerializer):
#     """Serializer for user data."""
#     class Meta:
#         model = CustomUser
#         fields = [
#             'id', 'username', 'email', 'first_name', 'last_name',
#             'phone_number', 'department', 'position', 'is_approved',
#             'is_active', 'is_staff', 'is_superuser', 'date_joined',
#             'created_at', 'updated_at'
#         ]
#         read_only_fields = [
#             'id', 'is_approved', 'is_active', 'is_staff', 
#             'is_superuser', 'date_joined', 'created_at', 'updated_at'
#         ]

class UserApprovalSerializer(serializers.Serializer):
    """Serializer for admin user approval."""
    is_approved = serializers.BooleanField()
    is_active = serializers.BooleanField(required=False)
    
    def update(self, instance, validated_data):
        """Update user approval status."""
        instance.is_approved = validated_data.get('is_approved', instance.is_approved)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()
        return instance

