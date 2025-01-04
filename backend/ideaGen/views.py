from django.shortcuts import render

# Create your views here.
# views.py
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse,HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import ProductIdea2, GeneratedImage2, Idea
import google.generativeai as genai
from huggingface_hub import InferenceClient
from PIL import Image
import io
import base64
from django.core.files.base import ContentFile
from datetime import datetime
 
# API configurations
GOOGLE_API_KEY = "AIzaSyC5Dqjx0DLbkRXH9YWqWZ1SPTK0w0C4oFY"
HF_API_TOKEN = "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"
 
# Initialize APIs
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')
hf_client = InferenceClient(
    model="black-forest-labs/FLUX.1-schnell",
    token=HF_API_TOKEN
)
 
def enhance_prompt(product_idea):
    """Convert product idea into a detailed image generation prompt"""
    base_prompt = f"""Professional product photography of {product_idea}, elegant composition, pure white background,
    high-end commercial style, studio lighting, ultra-detailed, product centered, marketing photo,
    commercial product shot, professional branding photography, crisp focus, professional white backdrop"""
   
    if any(word in product_idea.lower() for word in ['tech', 'gadget', 'electronic', 'digital']):
        base_prompt += ", futuristic lighting, clean minimalist style, glossy finish"
   
    if any(word in product_idea.lower() for word in ['eco', 'natural', 'organic', 'sustainable']):
        base_prompt += ", natural materials, eco-friendly appearance, sustainable design elements"
   
    if any(word in product_idea.lower() for word in ['luxury', 'premium', 'high-end']):
        base_prompt += ", luxury product photography, premium finish, elegant lighting"
   
    if any(word in product_idea.lower() for word in ['fashion', 'clothing', 'wear', 'accessory']):
        base_prompt += ", fashion photography style, lifestyle product shot, premium fabric details"
   
    return base_prompt
 
def generate_image(prompt, size=768, steps=30, guidance_scale=7.5):
    """Generate image using Hugging Face model"""
    parameters = {
        "width": size,
        "height": size,
        "num_inference_steps": steps,
        "guidance_scale": guidance_scale
    }
   
    try:
        response = hf_client.post(
            json={"inputs": prompt, "parameters": parameters}
        )
        return Image.open(io.BytesIO(response)), None
    except Exception as e:
        return None, str(e)
 
@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def generate_ideas(request):
    if request.method == "OPTIONS":
        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
       
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Extract base data
            product = data.get('product')
            brand = data.get('brand')
            category = data.get('category')
            number_of_ideas = int(data.get('number_of_ideas', 1))
            dynamic_fields = data.get('dynamicFields', {})
            
            # Create a ProductIdea2 instance
            product_idea = ProductIdea2.objects.create(
                product=product,
                brand=brand,
                category=category,
                number_of_ideas=number_of_ideas,
                dynamic_fields=dynamic_fields
            )
            
            # Generate ideas using existing prompt logic
            prompt = (
                f"Generate {number_of_ideas} product ideas for a {category} product named {product} under the brand {brand}.\n"
                "In addition to the standard details provided, the following dynamic attributes have been included:\n"
                f"{dynamic_fields}\n"
                "The dynamic attributes are provided as a dictionary, where the keys represent attribute categories or columns, and the values represent their corresponding details or inputs from the user.\n"
                "Format each idea as a JSON object with 'product_name' and 'description' fields.\n"
                "The 'description' should be clear, engaging, and written in simple language that highlights the product's key features and unique selling points. Ensure that the description explains how the product benefits the user and what makes it special, making it easy to visualize the idea.\n"
                "Make each idea unique and creative, focusing on different aspects of the product, including dynamic attributes, to appeal to a variety of user segments."
            )
            
            response = model.generate_content(prompt)
            
            try:
                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:-3]
                generated_ideas = json.loads(response_text)
                
                if not isinstance(generated_ideas, list):
                    generated_ideas = [generated_ideas]
                
                validated_ideas = []
                for idea_data in generated_ideas[:number_of_ideas]:
                    if isinstance(idea_data, dict) and 'product_name' in idea_data and 'description' in idea_data:
                        # Create Idea instance in database
                        idea = Idea.objects.create(
                            product_idea=product_idea,
                            product_name=idea_data['product_name'],
                            description=idea_data['description']
                        )
                        validated_ideas.append({
                            'idea_id': idea.id,
                            'product_name': idea.product_name,
                            'description': idea.description
                        })
                    
            except json.JSONDecodeError:
                # Handle text format parsing
                lines = response.text.split('\n')
                validated_ideas = []
                current_name = None
                current_description = []
                
                for line in lines:
                    if ' - ' in line:
                        if current_name and current_description:
                            idea = Idea.objects.create(
                                product_idea=product_idea,
                                product_name=current_name,
                                description=' '.join(current_description)
                            )
                            validated_ideas.append({
                                'idea_id': idea.id,
                                'product_name': idea.product_name,
                                'description': idea.description
                            })
                        name_part, desc_part = line.split(' - ', 1)
                        current_name = name_part.strip()
                        current_description = [desc_part.strip()]
                    elif line.strip() and current_name:
                        current_description.append(line.strip())
                
                if current_name and current_description:
                    idea = Idea.objects.create(
                        product_idea=product_idea,
                        product_name=current_name,
                        description=' '.join(current_description)
                    )
                    validated_ideas.append({
                        'idea_id': idea.id,
                        'product_name': idea.product_name,
                        'description': idea.description
                    })
            
            response = JsonResponse({
                "success": True,
                "ideas": validated_ideas,
                "stored_data": {
                    "product_idea_id": product_idea.id,
                    "product": product_idea.product,
                    "brand": product_idea.brand,
                    "category": product_idea.category,
                    "dynamic_fields": product_idea.dynamic_fields
                }
            })
            response["Access-Control-Allow-Origin"] = "http://localhost:5173"
            return response
            
        except Exception as e:
            print("Error:", str(e))
            response = JsonResponse({"success": False, "error": str(e)})
            response["Access-Control-Allow-Origin"] = "http://localhost:5173"
            return response


@csrf_exempt
@require_http_methods(["PUT", "OPTIONS"])
def update_idea(request):
    if request.method == "OPTIONS":
        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response["Access-Control-Allow-Methods"] = "PUT, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        response["Access-Control-Allow-Credentials"] = "true"
        return response

    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            idea_id = data.get('idea_id')
            
            # Get the idea instance
            idea = get_object_or_404(Idea, id=idea_id)
            
            # Update the idea
            idea.product_name = data.get('product_name', idea.product_name)
            idea.description = data.get('description', idea.description)
            idea.save()
            
            return JsonResponse({
                "success": True,
                "message": "Idea updated successfully",
                "updated_data": {
                    "idea_id": idea.id,
                    "product_name": idea.product_name,
                    "description": idea.description
                }
            })
            
        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            })

@csrf_exempt
@require_http_methods(["DELETE", "OPTIONS"])
def delete_idea(request):
    if request.method == "OPTIONS":
        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response["Access-Control-Allow-Methods"] = "DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        response["Access-Control-Allow-Credentials"] = "true"
        return response

    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            idea_id = data.get('idea_id')
            
            # Get and delete the idea (this will also delete related images due to CASCADE)
            idea = get_object_or_404(Idea, id=idea_id)
            idea.delete()
            
            return JsonResponse({
                "success": True,
                "message": "Idea deleted successfully"
            })
            
        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            }) 
@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def generate_product_image(request):
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_description = data.get('description')
            idea_id = data.get('idea_id')
            
            if not product_description:
                return JsonResponse({"success": False, "error": "Product description is required"})
            
            # Get the idea instance
            idea = get_object_or_404(Idea, id=idea_id)
            
            # Generate enhanced prompt and image
            enhanced_prompt = enhance_prompt(product_description)
            image, error = generate_image(enhanced_prompt)
            
            if error:
                return JsonResponse({"success": False, "error": error})
            
            # Convert PIL image to base64 for response
            img_buffer = io.BytesIO()
            image.save(img_buffer, format="PNG")
            img_str = base64.b64encode(img_buffer.getvalue()).decode()
            
            # Save image to database
            generated_image = GeneratedImage2.objects.create(
                idea=idea,
                prompt=enhanced_prompt,
                image=ContentFile(img_buffer.getvalue(), name=f"product_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            )
            
            return JsonResponse({
                "success": True,
                "image": img_str,
                "idea_id": idea_id
            })
            
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
