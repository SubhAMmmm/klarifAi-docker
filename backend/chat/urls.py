# chat/urls.py
from django.urls import path
from .views import (LoginView, SignupView, DocumentUploadView, 
    ChatView, 
    GetChatHistoryView,
    GetConversationView,
    GetUserDocumentsView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view(), name='signup'),  # New signup endpoint
    # Document handling
    path('upload-documents/', DocumentUploadView.as_view(), name='upload-documents'),
    
    # Chat functionality
    path('chat/', ChatView.as_view(), name='chat'),
    
    # Chat history endpoints
    path('chat-history/', GetChatHistoryView.as_view(), name='chat-history'),
    path('conversation/<str:conversation_id>/', GetConversationView.as_view(), name='get-conversation'),
    path('user-documents/', GetUserDocumentsView.as_view(), name='user-documents'),

]
