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
import time
import random
import io
import base64
from django.core.files.base import ContentFile
from datetime import datetime
from django.db.models import Q
import os
from django.conf import settings
 
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
            
            # Get the original idea
            original_idea = get_object_or_404(Idea, id=idea_id)
            
            # Create a new version instead of updating the existing one
            new_idea = Idea.objects.create(
                product_idea=original_idea.product_idea,
                product_name=data.get('product_name', original_idea.product_name),
                description=data.get('description', original_idea.description),
                original_idea_id=original_idea.id
            )
            
            response = JsonResponse({
                "success": True,
                "message": "New idea version created successfully",
                "updated_data": {
                    "idea_id": new_idea.id,
                    "product_name": new_idea.product_name,
                    "description": new_idea.description
                }
            })
            response["Access-Control-Allow-Origin"] = "http://localhost:5173"
            response["Access-Control-Allow-Credentials"] = "true"
            return response
            
        except Exception as e:
            response = JsonResponse({
                "success": False,
                "error": str(e)
            })
            response["Access-Control-Allow-Origin"] = "http://localhost:5173"
            response["Access-Control-Allow-Credentials"] = "true"
            return response
            

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
        
def decompose_product_description(product_description, model):
    """Break down product description into specific aspects using Gemini AI"""
    prompt = f"""
     You are an expert product designer and professional product photographer.
     Carefully analyze the following product description and decompose it into distinct visual elements that must be captured in a single product photograph.
 
 
    Product Description:
    {product_description}
 
    Instructions:
    1. Identify each visual component necessary for a comprehensive product shot.
    2. For every component, provide a one line description focusing on:
       - Physical attributes (shape, Dimensions, size, colors)
       - Materials and textures
       - Key features and functionality
       - Style and aesthetic elements
       - Target market positioning (if relevant)
    3. Include both technical and aesthetic aspects
 
    Important: Format your response as a simple list with one aspect per line, starting each line with a hyphen (-).
    """
   
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
       
        aspects = [
            line[1:].strip()
            for line in response_text.split('\n')
            if line.strip().startswith('-')
        ]
       
        return aspects if aspects else []
           
    except Exception as e:
        print(f"Error decomposing product description: {str(e)}")
        return []
   
def synthesize_product_aspects(product_description, aspects, model):
    """Synthesize product aspects into an enhanced description"""
    try:
        synthesis_prompt = f"""
        You are a seasoned product photographer and creative director. Using the following information, craft a single, cohesive product visualization description for an image.
 
        Original Product Description: {product_description}
       
        Detailed Aspects:
        {json.dumps(aspects, indent=2)}
       
        Requirements:
        1. Seamlessly integrate all identified aspects into one holistic description.
        2. Emphasize key visual details and composition (angles, focus points, etc.).
        3. Adhere to professional product photography standards (lighting, background, clarity).
        4. Note any crucial details (such as scale, brand elements, or unique design features).
        5. Make the description concise yet detailed enough for image generation.
 
 
        Deliverable:
        - Return only the final enhanced description suitable for an image-generation prompt.
        - Do not include any formatting other than plain text paragraphs.
        - Avoid restating the bullet points verbatim; instead, synthesize them into a fluid, descriptive narrative."""
       
        response = model.generate_content(synthesis_prompt)
        return response.text
    except Exception as e:
        print(f"Error in synthesis: {str(e)}")
        return product_description
 
def enhance_prompt(product_description, model):
    """Enhanced version of prompt generation with aspect decomposition"""
    # First, decompose the product description
    aspects = decompose_product_description(product_description, model)
   
    # Synthesize aspects into detailed description
    if aspects:
        enhanced_description = synthesize_product_aspects(product_description, aspects, model)
    else:
        enhanced_description = product_description
   
    # Base prompt with stronger emphasis on composition and detail
    base_prompt = f"""Ultra-detailed professional product photography of {enhanced_description}.
    - centered composition with all elements clearly visible
    - pure white seamless background
    - studio lighting setup with three-point lighting for balanced illumination
    - photorealistic high-resolution quality, razor sharp focus
    - perfectly clear and legible text or branding elements (if applicable)
    - commercial advertising style
    - product catalog photography
    - emphasis on key features and textures
    - clean, polished, and visualy striking appearance
    - professional marketing photo with balanced composition"""
   
    # Parse for specific elements
    product_description_lower = product_description.lower()
   
    # Technology and gadgets
    if any(word in product_description_lower for word in ['tech', 'gadget', 'electronic', 'digital', 'smart', 'device']):
        base_prompt += """, modern tech aesthetic, blue-tinted studio lighting,
        clean minimalist style, glossy finish on surfaces, subtle reflections,
        power indicators and displays clearly visible, interface elements sharp and legible,
        precise edge definition"""
   
    # Natural and eco-friendly products
    if any(word in product_description_lower for word in ['eco', 'natural', 'organic', 'sustainable', 'bamboo', 'wood']):
        base_prompt += """, natural material textures clearly visible,
        warm lighting to highlight organic materials, matte finish,
        environmental styling, earth tones, texture detail preserved,
        sustainable packaging visible, natural color accuracy"""
   
    # Luxury items
    if any(word in product_description_lower for word in ['luxury', 'premium', 'high-end', 'elegant', 'exclusive']):
        base_prompt += """, luxury product photography style, dramatic lighting,
        premium finish with metallic accents, sophisticated composition,
        attention to material quality, subtle shadows, elegant presentation,
        premium brand aesthetic, high-end commercial look"""
   
    # Fashion and accessories
    if any(word in product_description_lower for word in ['fashion', 'clothing', 'wear', 'accessory', 'jewelry', 'watch']):
        base_prompt += """, fashion magazine style, fabric textures clearly visible,
        detailed stitching, material draping, accessories prominently displayed,
        fashion lighting setup, premium fabric detail capture,
        clear view of patterns and textures, product fit visualization"""
 
    # Food & Beverage
    if any(word in product_description_lower for word in ['food', 'beverage', 'drink', 'edible', 'snack', 'meal']):
        base_prompt += """, mouth-watering presentation, vibrant colors to highlight freshness,
        clean plating or container styling, subtle steam or condensation for realism,
        appetizing composition, clear visibility of texture and ingredients,
        focus on tempting food photography style"""
 
    # Cosmetics & Personal Care
    if any(word in product_description_lower for word in ['cosmetic', 'skincare', 'beauty', 'makeup', 'personal care', 'cream', 'lotion']):
        base_prompt += """, glossy or matte finish to highlight product texture,
        soft lighting to capture subtle details, chic aesthetic, emphasis on packaging design,
        crisp labeling and brand logos, premium beauty photography style,
        clean and minimalist arrangement"""
 
    # Furniture & Home Décor
    if any(word in product_description_lower for word in ['furniture', 'sofa', 'table', 'chair', 'decor', 'home decor', 'interior']):
        base_prompt += """, emphasis on form and function, highlight material texture,
        realistic room setting or context if needed, warm and inviting lighting,
        balanced composition focusing on design lines, high-res detail capture,
        décor styling that complements the piece"""
 
    # Sports & Fitness Gear
    if any(word in product_description_lower for word in ['fitness', 'sports', 'gym', 'workout', 'exercise', 'athletic', 'equipment']):
        base_prompt += """, dynamic lighting to emphasize performance aspect,
        athletic or energetic vibe, highlight durable materials and ergonomic design,
        bright, high-contrast style, clear brand logos and performance features,
        sturdy construction visible"""
 
    # Kids & Toys
    if any(word in product_description_lower for word in ['kids', 'toy', 'children', 'child', 'toddler', 'baby', 'play']):
        base_prompt += """, playful and colorful composition, bright and cheerful lighting,
        emphasize safety features and soft edges, focus on fun and imaginative elements,
        child-friendly design details, attention to whimsical or cartoon styling"""
 
    # Automotive Products
    if any(word in product_description_lower for word in ['automotive', 'car accessory', 'vehicle', 'car care', 'motorcycle']):
        base_prompt += """, sleek automotive aesthetic, metallic finishes where applicable,
        emphasis on durability and craftsmanship, detail in mechanical design,
        brand or model references if relevant, rugged environment or track setting if needed,
        polished reflections for a premium look"""
 
    # Tools & Hardware
    if any(word in product_description_lower for word in ['tool', 'hardware', 'utility', 'drill', 'hammer', 'screwdriver']):
        base_prompt += """, focus on robust construction, industrial lighting style,
        highlight steel or metal textures, close-up detail of functional parts,
        brand or model labeling visible, functional stance, minimal background clutter"""
 
    # Healthcare & Medical Devices
    if any(word in product_description_lower for word in ['medical', 'healthcare', 'hospital', 'patient', 'monitor', 'diagnostic']):
        base_prompt += """, clean and clinical look, sterile white or light blue background,
        emphasis on safety and precision, clearly visible user interface or display,
        brand or classification labeling, highlight ergonomic design,
        precise and organized composition"""
 
    # E-Commerce
    if any(word in product_description_lower for word in ['e-commerce', 'ecommerce', 'marketplace', 'online store', 'digital cart', 'web shop', 'online platform'    ]):        
        base_prompt += """, packaging design with clear branding, device screens or interface elements visible if relevant,
        minimalist background with emphasis on the product or brand,
        cohesive color scheme that aligns with online retail aesthetics,
        modern commercial style photography, promotional-style lighting"""
 
    # BFSI (Banking, Financial Services, Insurance)
    if any(word in product_description_lower for word in ['finance', 'bank', 'insurance', 'loan', 'credit', 'debit', 'investment', 'fintech', 'financial', 'accounting', 'tax', 'mortgage' ]):
        base_prompt += """, emphasis on trustworthiness and credibility,
        sleek corporate color palette, subtle brand identity elements,
        minimalistic yet professional lighting, well-defined details symbolizing security and reliability,
        neat composition illustrating professional standards"""
 
    # B2B Services (Enterprise / Corporate / Consulting)
    if any(word in product_description_lower for word in ['enterprise', 'company', 'organization','b2b', 'corporate solutions', 'business services', 'professional services', 'consulting', 'industrial']):
        base_prompt += """, polished corporate look, professional environment cues,
        well-defined brand imagery or placeholders, subtle references to collaboration,
        modern and sophisticated lighting, neutral color palette,
        focus on clarity and straightforward presentation, intangible services represented by abstract or symbolic visuals"""
 
    # Add emphasis on maintaining all elements
    base_prompt += """, ensuring all mentioned elements remain in final composition,
    no elements missing or obscured, complete product representation,
    all features mentioned in description visible and clear"""
 
    return base_prompt

def generate_image_with_retry(client, prompt, size=768, steps=30, guidance_scale=7.5, max_retries=3, initial_delay=1):
    """Generate image with retry mechanism"""
    parameters = {
        "width": size,
        "height": size,
        "num_inference_steps": steps,
        "guidance_scale": guidance_scale
    }
    
    for attempt in range(max_retries):
        try:
            response = client.post(
                json={"inputs": prompt, "parameters": parameters}
            )
            
            image = Image.open(io.BytesIO(response))
            return image, None
            
        except Exception as e:
            error_msg = str(e)
            
            if attempt == max_retries - 1:
                return None, f"Failed after {max_retries} attempts. Last error: {error_msg}"
            
            delay = initial_delay * (2 ** attempt) + random.uniform(0, 0.1)
            time.sleep(delay)
            
            if "500" in error_msg and "Model too busy" in error_msg:
                steps = max(20, steps - 5)
                size = max(512, size - 256)
                parameters.update({
                    "width": size,
                    "height": size,
                    "num_inference_steps": steps
                })

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def generate_product_image(request):
    """Enhanced image generation endpoint with retry mechanism and fallback options"""
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
            
            # Get optional parameters with defaults
            size = data.get('size', 768)
            steps = data.get('steps', 30)
            guidance_scale = data.get('guidance_scale', 7.5)
            
            if not product_description:
                return JsonResponse({"success": False, "error": "Product description is required"})
            
            # Get the idea instance
            idea = get_object_or_404(Idea, id=idea_id)
            
            # Generate enhanced prompt
            enhanced_prompt = enhance_prompt(product_description, model)
            
            # Try generating image with provided parameters
            image, error = generate_image_with_retry(
                hf_client,
                enhanced_prompt,
                size=size,
                steps=steps,
                guidance_scale=guidance_scale
            )
            
            if error:
                # Try fallback parameters
                image, fallback_error = generate_image_with_retry(
                    hf_client,
                    enhanced_prompt,
                    size=512,
                    steps=20,
                    guidance_scale=guidance_scale,
                    max_retries=2
                )
                
                if fallback_error:
                    return JsonResponse({
                        "success": False,
                        "error": f"Image generation failed: {fallback_error}"
                    })
            
            # Convert PIL image to base64 for response
            img_buffer = io.BytesIO()
            image.save(img_buffer, format="PNG")
            img_str = base64.b64encode(img_buffer.getvalue()).decode()

            # Ensure generated_images directory exists
            # Ensure generated_images directory exists
            os.makedirs(os.path.join(settings.MEDIA_ROOT, 'generated_images'), exist_ok=True)
        
            # Create a unique filename
            filename = f"product_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            full_path = os.path.join(settings.MEDIA_ROOT, 'generated_images', filename)

            # Save image to file system
            with open(full_path, 'wb') as f:
                f.write(img_buffer.getvalue())

            # Save image to database with parameters
            generated_image = GeneratedImage2.objects.create(
                idea=idea,
                prompt=enhanced_prompt,
                image=ContentFile(
                    img_buffer.getvalue(),
                    name=f"product_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                ),
                parameters=json.dumps({
                    'size': size,
                    'steps': steps,
                    'guidance_scale': guidance_scale
                })
            )

            # Open the saved file and attach it to the model
            with open(full_path, 'rb') as f:
                generated_image.image.save(filename, ContentFile(f.read()))
        
            # Convert to base64 for response
            with open(full_path, 'rb') as f:
                img_str = base64.b64encode(f.read()).decode()
            
            return JsonResponse({
                "success": True,
                "image": img_str,
                "idea_id": idea_id,
                "generated_image_id": generated_image.id,
                "parameters": {
                    'size': size,
                    'steps': steps,
                    'guidance_scale': guidance_scale
                }
            })
            
        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            })

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def regenerate_product_image(request):
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
            
            # Get generation parameters
            size = int(data.get('size', 768))  # Default to 768
            steps = int(data.get('steps', 30))  # Default to 30
            guidance_scale = float(data.get('guidance_scale', 7.5))  # Default to 7.5
            
            # Validate parameters
            if size not in [512, 768, 1024, 1280]:
                size = 768  # Default if invalid
            if not (20 <= steps <= 50):
                steps = 30  # Default if out of range
            if not (1.0 <= guidance_scale <= 20.0):
                guidance_scale = 7.5  # Default if out of range
            
            if not product_description:
                return JsonResponse({"success": False, "error": "Product description is required"})
            
            # Get the idea instance
            idea = get_object_or_404(Idea, id=idea_id)
            
            # Generate enhanced prompt
            enhanced_prompt = enhance_prompt(product_description, model)
            
            # Try generating image with provided parameters
            image, error = generate_image_with_retry(
                hf_client,
                enhanced_prompt,
                size=size,
                steps=steps,
                guidance_scale=guidance_scale
            )
            
            if error:
                # Try fallback parameters
                image, fallback_error = generate_image_with_retry(
                    hf_client,
                    enhanced_prompt,
                    size=512,
                    steps=20,
                    guidance_scale=guidance_scale,
                    max_retries=2
                )
                
                if fallback_error:
                    return JsonResponse({
                        "success": False,
                        "error": f"Image regeneration failed: {fallback_error}"
                    })
            
            # Convert PIL image to base64 for response
            img_buffer = io.BytesIO()
            image.save(img_buffer, format="PNG")
            img_str = base64.b64encode(img_buffer.getvalue()).decode()
            
            # Save regenerated image to database
            generated_image = GeneratedImage2.objects.create(
                idea=idea,
                prompt=enhanced_prompt,
                image=ContentFile(
                    img_buffer.getvalue(),
                    name=f"product_image_regen_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                ),
                parameters=json.dumps({
                    'size': size,
                    'steps': steps,
                    'guidance_scale': guidance_scale,
                    'is_regenerated': True,
                    'original_description': product_description
                })
            )
            
            return JsonResponse({
                "success": True,
                "image": img_str,
                "idea_id": idea_id,
                "parameters": {
                    'size': size,
                    'steps': steps,
                    'guidance_scale': guidance_scale
                },
                "generated_image_id": generated_image.id
            })
            
        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            })
        

# views.py
def get_idea_history(request, idea_id):
    try:
        current_idea = get_object_or_404(Idea, id=idea_id)
        
        # Find the root idea and all its versions
        if current_idea.original_idea_id:
            # If this is a version, get the root idea
            root_idea_id = current_idea.original_idea_id
        else:
            # This is the root idea
            root_idea_id = current_idea.id
            
        # Get all versions related to this root idea including the root itself
        idea_versions = Idea.objects.filter(
            Q(id=root_idea_id) |  
            Q(original_idea_id=root_idea_id)
        ).order_by('created_at')
        
        # Determine if there are actual edits
        has_edits = idea_versions.count() > 1
        
        # Process idea versions
        version_data = []
        for version in idea_versions:
            version_data.append({
                'id': version.id,
                'product_name': version.product_name,
                'description': version.description,
                'created_at': version.created_at.isoformat(),
                'is_current': version.id == current_idea.id,
                'show_restore': version.id != current_idea.id  # Only show restore for non-current versions
            })
            
        # Get only images related to these specific versions
        image_versions = GeneratedImage2.objects.filter(
            idea_id__in=[v['id'] for v in version_data]
        ).order_by('-created_at')
        
        # Determine if there are multiple image generations
        has_multiple_images = image_versions.count() > 1
        
        image_data = []
        for img in image_versions:
            try:
                if img.image and os.path.exists(img.image.path):
                    with open(img.image.path, 'rb') as image_file:
                        image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
                    
                    image_data.append({
                        'id': img.id,
                        'image_url': image_base64,
                        'created_at': img.created_at.isoformat(),
                        'parameters': img.parameters,
                        'idea_id': img.idea_id,
                        'is_regenerated': json.loads(img.parameters).get('is_regenerated', False) if img.parameters else False
                    })
            except Exception as file_error:
                print(f"Error processing image {img.id}: {file_error}")
        
        return JsonResponse({
            'success': True,
            'history': {
                'idea_versions': version_data,
                'image_versions': image_data,
                'has_idea_edits': has_edits,
                'has_multiple_images': has_multiple_images
            }
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def restore_idea_version(request):
    try:
        data = json.loads(request.body)
        version_id = data.get('version_id')
        current_id = data.get('current_id')
        image_id = data.get('image_id')
        
        # Get the version to restore and its associated image
        version_idea = get_object_or_404(Idea, id=version_id)
        current_idea = get_object_or_404(Idea, id=current_id)
        
        # Create a new version with restored data
        restored_idea = Idea.objects.create(
            product_idea=current_idea.product_idea,
            product_name=version_idea.product_name,
            description=version_idea.description,
            original_idea_id=current_idea.id
        )
        
        # Retrieve all images associated with the original version
        original_images = GeneratedImage2.objects.filter(idea_id=version_id)
        
        # Copy all images from the original version
        restored_images = []
        restored_image_base64 = None
        for original_image in original_images:
            # Create a new image instance for each original image
            restored_image = GeneratedImage2.objects.create(
                idea=restored_idea,
                prompt=original_image.prompt,
                parameters=original_image.parameters,
                created_at=original_image.created_at  # Preserve original creation timestamp
            )
            
            # Copy the image file
            if original_image.image:
                restored_image.image.save(
                    original_image.image.name,
                    ContentFile(original_image.image.read())
                )
            
            restored_images.append(restored_image)
            
            # If this is the specified image or the first image, convert to base64
            if (image_id and original_image.id == image_id) or (not image_id and not restored_image_base64):
                with open(restored_image.image.path, 'rb') as img_file:
                    restored_image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
        
        # Prepare image versions for response
        image_versions = []
        for img in restored_images:
            with open(img.image.path, 'rb') as img_file:
                image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                image_versions.append({
                    'id': img.id,
                    'image_url': image_base64,
                    'created_at': img.created_at.isoformat(),
                    'parameters': img.parameters
                })
        
        return JsonResponse({
            'success': True,
            'idea': {
                'id': restored_idea.id,
                'idea_id': restored_idea.id,
                'product_name': restored_idea.product_name,
                'description': restored_idea.description,
                'image_url': restored_image_base64,
                'images': image_versions  # Include all image versions
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })
    

