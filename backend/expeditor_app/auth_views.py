import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from .auth_serializers import UserRegistrationSerializer, UserLoginSerializer

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user (requires admin approval)."""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        if not username or not password or not email:
            return Response({
                'error': 'Username, password, and email are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_staff=False,
            is_superuser=False
        )
        
        logger.info(f"New user registered: {user.username}")
        
        return Response({
            'message': 'Registration successful. Your account is active.',
            'user_id': user.id,
            'username': user.username,
            'is_approved': True  # Django User modelida is_approved yo'q, shuning uchun True
        }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response({
            'error': 'Registration failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user and return token."""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        logger.info(f"Login attempt: username={username}")
        
        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        logger.info(f"Authenticate result: {user}")
        
        if user:
            if not user.is_active:
                return Response({
                    'error': 'Your account is deactivated. Please contact administrator.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Create or get token
            token, created = Token.objects.get_or_create(user=user)
            logger.info(f"Token created: {token.key}")
            
            logger.info(f"User logged in: {user.username}")
            
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_approved': user.is_superuser or user.is_staff,  # Superuser va staff avtomatik approved
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined.isoformat(),
                    'created_at': user.date_joined.isoformat(),
                    'updated_at': user.date_joined.isoformat(),
                },
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Login failed for username: {username}")
            return Response({
                'error': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({
            'error': 'Login failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Logout user and delete token."""
    try:
        # Delete the token
        request.user.auth_token.delete()
        
        logger.info(f"User logged out: {request.user.username}")
        
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({
            'error': 'Logout failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user profile."""
    try:
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_approved': request.user.is_superuser or request.user.is_staff,
            'is_active': request.user.is_active,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser,
            'date_joined': request.user.date_joined.isoformat(),
            'created_at': request.user.date_joined.isoformat(),
            'updated_at': request.user.date_joined.isoformat(),
        }
        return Response({
            'user': user_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return Response({
            'error': 'Failed to get user profile'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth_status(request):
    """Check if user is authenticated and approved."""
    try:
        user = request.user
        return Response({
            'is_authenticated': True,
            'is_approved': user.is_superuser or user.is_staff,
            'is_active': user.is_active,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Auth status check error: {str(e)}")
        return Response({
            'error': 'Failed to check authentication status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

