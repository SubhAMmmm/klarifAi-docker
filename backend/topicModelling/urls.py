from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DataAnalysisViewSet

app_name = 'topic_analyzer'  # Replace with your app name

router = DefaultRouter()
router.register(r'analysis', DataAnalysisViewSet, basename='analysis')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/analysis/upload_dataset/', DataAnalysisViewSet.as_view({'post': 'upload_dataset'})),
    path('api/analysis/enhanced_handle_custom_analysis/', DataAnalysisViewSet.as_view({'post': 'enhanced_handle_custom_analysis'})),
    path('api/analysis/analyze_sentiment/', DataAnalysisViewSet.as_view({'post': 'analyze_sentiment'})),
    path('api/analysis/semantic_search/', DataAnalysisViewSet.as_view({'post': 'semantic_search'})),
]