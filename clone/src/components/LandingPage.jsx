//LandingPage.jsx
/* eslint-disable no-unused-vars */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import logo from '../assets/Logo1.png';
import Header from './dashboard/Header';
import brandscapesLogo from '../assets/brand-scarpes-logo.png';
import backgroundImage from "../assets/bg-main.jpg";
import { 
  FileSearch, 
  Lightbulb, 
  Network, 
  Database,
  ArrowRight
} from 'lucide-react';

const features = [
    {
      title: 'Document Q&A',
      icon: FileSearch,
      description: 'Upload and chat with your documents to get instant summaries, accurate answers, and key insights, powered by AI.',
      path: '/dashboard',
      actionText: 'Chat with Docs' 
    },
    {
      title: 'Idea Generator',
      icon: Lightbulb,
      description: 'Generate creative ideas, images and solutions using advanced AI brainstorming techniques.',
      path: '/idea-generation',
      actionText: 'Generate Ideas'
    },
    {
      title: 'Topic Modeling',
      icon: Network,
      description: 'A smart data analysis tool that extracts topics and provides natural language insights.',
      path: '/topic-modeling',
      actionText: 'Analyze Topics'
    },
    {
      title: 'Structured Data Query',
      icon: Database,
      description: 'Transform natural language into precise SQL queries, enabling intuitive data exploration without complex database syntax.',
      path: '/structured-data-query',
      actionText: 'Start Querying'
    }
];

const FeatureCard = ({ title, Icon, description, path, actionText }) => {
    const navigate = useNavigate();

    const handleNavigation = (e) => {
        e.preventDefault();
        if (path.startsWith('http://') || path.startsWith('https://')) {
            window.location.href = path;
        } else {
            navigate(path);
        }
    };

    return (
        <div 
            className="group relative rounded-lg p-4 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden h-full border border-emerald-500/20 backdrop-blur-xl bg-emerald-900/20"
            aria-label={title}
            role="button"
            tabIndex={0}
            onClick={handleNavigation}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigation(e)}
        >
        
            <div 
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                aria-hidden="true"
            />

            <div className="relative flex flex-col items-center text-center space-y-4">
                <div 
                    className="p-2 rounded-full transition-colors duration-300"
                    style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                    }}
                >
                    <Icon className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                </div>
                
                <h3 className="text-base font-bold text-transparent bg-clip-text bg-blue-400">
                    {title}
                </h3>
                
                <p className="text-sm text-gray-300 leading-relaxed">
                    {description}
                </p>
                
                <button 
                    className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 hover:brightness-110 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:outline-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
                    }}
                    aria-label={`${actionText} - ${title}`}
                >
                    {actionText}
                    <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const LandingPage = () => {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background with optimized loading */}
            <div 
                className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
                role="img"
                aria-label="Background"
            />
            
            <div className="absolute inset-0 bg-black/50 z-1" aria-hidden="true" />
            
            <div className="relative z-10 min-h-screen flex flex-col">
                <Header />
                
                <div className="flex-1 container mx-auto px-4 py-16">
                    <header className="text-center space-y-3  mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            Welcome to KLARIFai !
                        </h1>
                        <h2 className="text-base md:text-lg text-gray-300 font-light">
                            GPT-Powered Insights Activator
                        </h2>
                    </header>

                    <main className="flex-1">
                        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            {features.map((feature) => (
                                <FeatureCard
                                    key={feature.title}
                                    title={feature.title}
                                    Icon={feature.icon}
                                    description={feature.description}
                                    path={feature.path}
                                    actionText={feature.actionText}
                                />
                            ))}
                        </div>
                    </main>
                </div>

                <footer className="mt-auto border-t border-white/10 bg-black/20 backdrop-blur-md">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-center space-x-3">
                            <span className="text-gray-300 text-sm font-semibold">
                                Powered By
                            </span>
                            <div className="flex items-center">
                                <img
                                    src={brandscapesLogo}
                                    alt="BrandScapes Worldwide Logo"
                                    className="h-4 w-auto object-contain transition-transform hover:scale-105"
                                />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

FeatureCard.propTypes = {
    title: PropTypes.string.isRequired,
    Icon: PropTypes.elementType.isRequired,
    description: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    actionText: PropTypes.string.isRequired
};

export default LandingPage;