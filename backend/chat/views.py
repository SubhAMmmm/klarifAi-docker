# from django.contrib.auth.models import User
# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView

# class SignupView(APIView):
#     def post(self, request):
#         username = request.data.get('username')
#         email = request.data.get('email')
#         password = request.data.get('password')

#         if not username or not email or not password:
#             return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

#         if User.objects.filter(username=username).exists():
#             return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

#         if User.objects.filter(email=email).exists():
#             return Response({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

#         user = User.objects.create_user(username=username, email=email, password=password)
#         user.save()

#         return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)




# # Example login view
# class LoginView(APIView):
#     def post(self, request):
#         # Your login logic here
#         return Response({"message": "Login successful"}, status=status.HTTP_200_OK)

# from django.contrib.auth.models import User
# from django.contrib.auth import authenticate
# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from rest_framework.authtoken.models import Token  # Import Token model

# # Signup View
# class SignupView(APIView):
#     def post(self, request):
#         username = request.data.get('username')
#         email = request.data.get('email')
#         password = request.data.get('password')

#         if not username or not email or not password:
#             return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

#         if User.objects.filter(username=username).exists():
#             return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

#         if User.objects.filter(email=email).exists():
#             return Response({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

#         user = User.objects.create_user(username=username, email=email, password=password)
#         user.save()

#         return Response({"message": "User  created successfully"}, status=status.HTTP_201_CREATED)

# # Login View
# class LoginView(APIView):
#     def post(self, request):
#         username = request.data.get('username')
#         password = request.data.get('password')

#         user = authenticate(username=username, password=password)
#         if user is not None:
#             token, created = Token.objects.get_or_create(user=user)  # Create or get token
#             return Response({"token": token.key, "message": "Login successful"}, status=status.HTTP_200_OK)
#         return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# # File Upload and Conversation View remains unchanged


# # Define FileUploadView here if it’s not already defined
# class FileUploadView(APIView):
#     def post(self, request):
#         # Your file upload logic here
#         return Response({"message": "File uploaded successfully"}, status=status.HTTP_201_CREATED)

# # Example conversation view
# class ConversationView(APIView):
#     def get(self, request):
#         # Your conversation retrieval logic here
#         return Response({"message": "Conversation history"}, status=status.HTTP_200_OK)


from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import os
import tempfile
import pickle
from llama_parse import LlamaParse
from .models import Document, ChatHistory, ProcessedIndex
import uuid
from datetime import datetime
# new
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.util import ngrams
from collections import Counter
import faiss
import numpy as np
import os
import tempfile
import pickle
import re
from llama_parse import LlamaParse
from .models import Document, ProcessedIndex
import uuid
import google.generativeai as genai
from rest_framework.permissions import AllowAny  # Important for signup/login


# Configure Google Generative AI
GOOGLE_API_KEY = "AIzaSyDOKm5KYY6LjLa20IbZg027fQauwyMOKWQ"
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

class SignupView(APIView):
    # Explicitly set permission to allow any user (including unauthenticated)
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication checks

    def post(self, request):
        # Extract data from request
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        # Validate input
        if not username or not email or not password:
            return Response({
                'error': 'Please provide username, email, and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create new user
        try:
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password
            )
            
            # Generate token for the new user
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'User created successfully',
                'token': token.key,
                'username': user.username
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    # Explicitly set permission to allow any user (including unauthenticated)
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication checks

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Validate input
        if not username or not password:
            return Response({
                'error': 'Please provide username and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user
        user = authenticate(username=username, password=password)

        if user:
            # Generate or get existing token
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'username': user.username
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

class GetUserDocumentsView(APIView):
    def get(self, request):
        try:
            user = request.user
            documents = Document.objects.filter(user=user).select_related('processedindex')
           
            document_list = []
            for doc in documents:
                try:
                    processed = doc.processedindex
                    document_list.append({
                        'id': doc.id,
                        'filename': doc.filename,
                        'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
                        'summary': processed.summary,
                        'follow_up_questions': [
                            processed.follow_up_question_1,
                            processed.follow_up_question_2,
                            processed.follow_up_question_3
                        ] if all([processed.follow_up_question_1,
                                processed.follow_up_question_2,
                                processed.follow_up_question_3]) else []
                    })
                except ProcessedIndex.DoesNotExist:
                    document_list.append({
                        'id': doc.id,
                        'filename': doc.filename,
                        'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
                        'summary': 'Document processing pending',
                        'follow_up_questions': []
                    })
           
            return Response(document_list, status=status.HTTP_200_OK)
           
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch documents: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DocumentUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        files = request.FILES.getlist('files')
        user = request.user

        try:
            uploaded_docs = []
            for file in files:
                document = Document.objects.create(user=user, file=file, filename=file.name)
                processed_data = self.process_document(file)

                # Create markdown directory if it doesn't exist
                markdown_dir = os.path.join(settings.MEDIA_ROOT, 'markdown')
                os.makedirs(markdown_dir, exist_ok=True)

                # Save markdown with key terms
                markdown_path = self.save_markdown(
                    processed_data['full_text'],
                    file.name,
                    processed_data['key_terms'],
                    markdown_dir
                )

                ProcessedIndex.objects.create(
                    document=document,
                    faiss_index=processed_data['index_path'],
                    metadata=processed_data['metadata_path'],
                    summary=processed_data['summary'],
                    markdown_path=markdown_path
                )

                uploaded_docs.append({
                    'filename': file.name,
                    'summary': processed_data['summary'],
                    'follow_up_questions': processed_data['follow_up_questions'],
                    'key_terms': processed_data['key_terms']
                })

            return Response({
                'message': 'Documents processed successfully',
                'documents': uploaded_docs
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def process_document(self, file):
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            for chunk in file.chunks():
                tmp_file.write(chunk)
            pdf_path = tmp_file.name

        text_embedder = SentenceTransformer('all-MiniLM-L6-v2')
        faiss_index = faiss.IndexFlatL2(384)

        # Parse the document using LlamaParse
        parser = LlamaParse(
            api_key="llx-rprJeq8dEhN3EJke5UDGSSWP1za8GV7540ci1yX8arJmRyWr",
            result_type="markdown",
            verbose=True,
            images=True,
            premium_mode=True
        )
        parsed_documents = parser.load_data(pdf_path)
        full_text = '\n'.join([doc.text for doc in parsed_documents])

        # Extract key terms using topic modeling
        key_terms = self.extract_key_terms(full_text)

        # Generate summary and follow-up questions
        summary, follow_up_questions = self.generate_summary(full_text, file.name)
        print('***********',summary)
        # Create embeddings and metadata
        texts_to_embed = [doc.text for doc in parsed_documents]
        metadata_store = []

        for doc in parsed_documents:
            metadata_store.append({
                "content": doc.text,
                "source_file": file.name,
                "page_number": getattr(doc, 'page', 'Unknown'),
                "section_title": getattr(doc, 'section_title', 'Unknown')
            })

        embeddings = text_embedder.encode(texts_to_embed, convert_to_tensor=True)
        faiss_index.add(np.array(embeddings).astype('float32'))

        # Save FAISS index and metadata
        index_path, metadata_path = self.save_index_and_metadata(faiss_index, metadata_store, file.name)

        os.unlink(pdf_path)
        print(summary)

        return {
            'index_path': index_path,
            'metadata_path': metadata_path,
            'summary': summary,
            'follow_up_questions': follow_up_questions,
            'key_terms': key_terms,
            'full_text': full_text
        }

    def extract_key_terms(self, content, num_topics=5):
        """Extract key terms using N-grams, TF-IDF, and topic modeling"""
        # Tokenize and clean the content
        stop_words = set(stopwords.words('english'))
        words = re.findall(r'\b\w+\b', content.lower())
        words = [word for word in words if word not in stop_words and len(word) > 2]

        # Generate N-grams
        n_grams = list(ngrams(words, 2)) + list(ngrams(words, 3))
        n_gram_counts = Counter([" ".join(gram) for gram in n_grams]).most_common(10)

        # TF-IDF Vectorization
        vectorizer = TfidfVectorizer(stop_words='english', max_features=50)
        tfidf_matrix = vectorizer.fit_transform([content])
        tfidf_scores = dict(zip(vectorizer.get_feature_names_out(), tfidf_matrix.toarray().flatten()))

        # Topic Modeling
        lda = LatentDirichletAllocation(n_components=num_topics, random_state=0)
        lda.fit(tfidf_matrix)
        
        topic_terms = {}
        for idx, topic in enumerate(lda.components_):
            terms = [vectorizer.get_feature_names_out()[i] for i in topic.argsort()[:-6:-1]]
            topic_terms[f"Topic {idx+1}"] = terms

        # Aggregate key terms
        key_terms = dict(n_gram_counts)
        key_terms.update(tfidf_scores)
        for topic, terms in topic_terms.items():
            for term in terms:
                key_terms[term] = key_terms.get(term, 0) + 1

        return key_terms

    def save_markdown(self, md_text, pdf_name, key_terms, markdown_dir):
        """Save markdown content with key terms"""
        base_name = os.path.splitext(pdf_name)[0]
        safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
        md_path = os.path.join(markdown_dir, f"{safe_name}.md")

        with open(md_path, "w", encoding='utf-8') as f:
            f.write(md_text)
            f.write("\n\n# Key Terms and Frequencies\n")
            for term, freq in key_terms.items():
                f.write(f"- {term}: {freq}\n")

        return md_path

    def save_index_and_metadata(self, index, metadata, pdf_name):
        """Save FAISS index and metadata"""
        base_name = os.path.splitext(pdf_name)[0]
        safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
        
        # Create directories if they don't exist
        index_dir = os.path.join(settings.MEDIA_ROOT, 'indices')
        metadata_dir = os.path.join(settings.MEDIA_ROOT, 'metadata')
        os.makedirs(index_dir, exist_ok=True)
        os.makedirs(metadata_dir, exist_ok=True)

        index_path = os.path.join(index_dir, f"{safe_name}_index.faiss")
        metadata_path = os.path.join(metadata_dir, f"{safe_name}_metadata.pkl")

        faiss.write_index(index, index_path)
        with open(metadata_path, 'wb') as f:
            pickle.dump(metadata, f)

        return index_path, metadata_path

    def generate_summary(self, content, file_name):
        max_chars = 30000
        truncated_content = content[:max_chars] if len(content) > max_chars else content
       
        prompt = f"""
        Please analyze this document '{file_name}' and provide:
        1. A comprehensive summary of the main points and key findings
        2. Three specific follow-up questions that would help understand the content better
       
        Content: {truncated_content}
       
        Format your response as:
        SUMMARY:
        [Your summary here]
       
        QUESTIONS:
        1. [First question]
        2. [Second question]
        3. [Third question]
        """
       
        try:
            response = model.generate_content(prompt)
            response_text = response.text
            parts = response_text.split('QUESTIONS:')
            summary = parts[0].replace('SUMMARY:', '').strip()
           
            questions = [q.strip().lstrip('123. ') for q in parts[1].strip().split('\n') if q.strip()] if len(parts) > 1 else []
            while len(questions) < 3:
                questions.append("What other aspects of this document would you like to explore?")
            return summary, questions[:3]
           
        except Exception as e:
            print(f"Error generating summary: {str(e)}")
            return (
                f"Error generating summary for {file_name}",
                [
                    "What would you like to know about this document?",
                    "Would you like me to explain any specific part?",
                    "How can I help you understand this content better?"
                ]
            )
            
        except Exception as e:
            print(f"Summary generation error: {e}")
            return (
                "Unable to generate summary",
                [
                    "What would you like to know?",
                    "Can you provide more context?",
                    "Shall we discuss the document in more detail?"
                ]
            )

class GetChatHistoryView(APIView):
    def get(self, request):
        try:
            user = request.user
            
            conversations = ChatHistory.objects.filter(user=user)\
                .values('conversation_id', 'created_at', 'title')\
                .distinct()\
                .order_by('-created_at')
            
            history = []
            for conv in conversations:
                first_message = ChatHistory.objects.filter(
                    user=user,
                    conversation_id=conv['conversation_id']
                ).first()
                
                history.append({
                    'conversation_id': conv['conversation_id'],
                    'title': first_message.title if first_message else f"Chat {conv['created_at'].strftime('%Y-%m-%d %H:%M')}",
                    'created_at': conv['created_at'].strftime('%Y-%m-%d %H:%M'),
                    'preview': first_message.question if first_message else ""
                })
            
            return Response(history, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch chat history: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetConversationView(APIView):
    def get(self, request, conversation_id):
        try:
            user = request.user
            
            messages = ChatHistory.objects.filter(
                user=user,
                conversation_id=conversation_id
            ).order_by('created_at')
            
            if not messages.exists():
                return Response(
                    {'error': 'Conversation not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            conversation = []
            for msg in messages:
                conversation.append({
                    'id': msg.id,
                    'question': msg.question,
                    'answer': msg.answer,
                    'timestamp': msg.created_at.strftime('%Y-%m-%d %H:%M'),
                })
            
            return Response({
                'conversation_id': conversation_id,
                'title': messages[0].title if messages else "Untitled Chat",
                'messages': conversation
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch conversation: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatView(APIView):
    def post(self, request):
        try:
            if not request.data.get('message'):
                return Response(
                    {'error': 'Message is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            query = request.data.get('message')
            additional_input = request.data.get('additional_input', '')
            if additional_input:
                query += f" {additional_input}"
            
            user = request.user
            
            processed_docs = ProcessedIndex.objects.filter(document__user=user)
            if not processed_docs.exists():
                return Response(
                    {'error': 'No processed documents found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            results = self.search_documents(query, processed_docs)
            response, follow_up_questions = self.generate_response(query, results)

            conversation_id = results.get('conversation_id') or str(uuid.uuid4())
            title = results.get('title') or f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"

            ChatHistory.objects.create(
                user=user,
                question=query,
                answer=response,
                conversation_id=conversation_id,
                title=title
            )

            return Response({
                'response': response,
                # 'citations': results.get('citations', []),
                'follow_up_questions': follow_up_questions,
                'conversation_id': conversation_id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error in ChatView: {str(e)}")
            return Response(
                {'error': 'An error occurred while processing your request'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def search_documents(self, query, processed_docs):
        text_embedder = SentenceTransformer('all-MiniLM-L6-v2')
        query_embedding = text_embedder.encode([query])[0]

        all_results = []
        all_citations = []

        for proc_doc in processed_docs:
            try:
                if not os.path.exists(proc_doc.faiss_index):
                    print(f"FAISS index not found: {proc_doc.faiss_index}")
                    continue
                    
                if not os.path.exists(proc_doc.metadata):
                    print(f"Metadata file not found: {proc_doc.metadata}")
                    continue

                index = faiss.read_index(proc_doc.faiss_index)
                with open(proc_doc.metadata, 'rb') as f:
                    metadata = pickle.load(f)

                D, I = index.search(query_embedding.reshape(1, -1), k=5)

                for idx in I[0]:
                    if idx < len(metadata):
                        all_results.append(metadata[idx]['content'])
                        all_citations.append({
                            'source_file': proc_doc.document.filename,
                            'page_number': metadata[idx].get('page_number', 'Unknown'),
                            'section_title': metadata[idx].get('section_title', 'Unknown')
                        })

            except Exception as e:
                print(f"Error processing document {proc_doc.document.filename}: {str(e)}")
                continue

        return {
            'contents': all_results,
            'citations': all_citations,
            'conversation_id': str(uuid.uuid4()),
            'title': f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        }

    def generate_response(self, query, results):
        if not results['contents']:
            return "I couldn't find any relevant information in the uploaded documents.", []

        context = []
        for content, citation in zip(results['contents'], results['citations']):
            citation_text = (
                f"From document '{citation['source_file']}' "
                f"(Page {citation['page_number']}, Section: '{citation['section_title']}')"
            )
            context.append(f"{citation_text}: {content}")

        prompt = f"""
        Based ONLY on the following context from multiple documents, answer this question:
        {query}

        Context:
        {''.join(context)}

        Please provide a detailed answer with citations. Include any relevant quantitative 
        details available in the context.
        """

        try:
            response = model.generate_content(prompt)
            follow_up_questions = self.generate_follow_up_questions(context)
            return response.text, follow_up_questions
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return "I encountered an error while generating the response.", []

    def generate_follow_up_questions(self, context):
        prompt = f"""
        Based on this context, suggest 3 relevant follow-up questions:
        {''.join(context[:3])}
        """
        
        try:
            response = model.generate_content(prompt)
            questions = response.text.split('\n')
            return questions[:3]
        except Exception as e:
            print(f"Error generating follow-up questions: {str(e)}")
            return [
                "What additional information would you like to know?",
                "Would you like me to elaborate on any specific point?",
                "How can I help clarify this information further?"
            ]