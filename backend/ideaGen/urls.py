# idea_generator/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate-ideas/', views.generate_ideas, name='generate_ideas'),
    path('update-idea/', views.update_idea, name='update_idea'),
    path('delete-idea/', views.delete_idea, name='delete_idea'),
    path('generate-product-image/', views.generate_product_image, name='generate_product_image'),
]