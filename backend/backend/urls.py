
# backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ideas/', include('ideaGen.urls')),
    path('api/', include('chat.urls')),  # Make sure this is included
]
