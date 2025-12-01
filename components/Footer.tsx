
import React from 'react';
import { TwitterIcon, InstagramIcon, GithubIcon, LinkedinIcon, RssIcon, ChatBubbleIcon } from './IconComponents';
import { downloadRssFeed } from '../services/rssService';

interface FooterProps {
    onOpenFeedback: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenFeedback }) => {
    const handleRssClick = (e: React.MouseEvent) => {
        e.preventDefault();
        downloadRssFeed();
    };
    
    const handleFeedbackClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenFeedback();
    };

    const socialLinks = [
        { name: 'Twitter', icon: TwitterIcon, href: '#', color: 'hover:text-[#1DA1F2]' },
        { name: 'Instagram', icon: InstagramIcon, href: '#', color: 'hover:text-[#E4405F]' },
        { name: 'GitHub', icon: GithubIcon, href: '#', color: 'hover:text-gray-900 dark:hover:text-red-500' },
        { name: 'LinkedIn', icon: LinkedinIcon, href: '#', color: 'hover:text-[#0A66C2]' },
        { name: 'Feedback', icon: ChatBubbleIcon, href: '#', color: 'hover:text-green-500', onClick: handleFeedbackClick },
        { name: 'RSS Feed', icon: RssIcon, href: '#', color: 'hover:text-orange-500', onClick: handleRssClick },
    ];

    return (
        <footer className="bg-transparent border-t border-black/10 dark:border-gray-800 text-slate-500 dark:text-slate-400 mt-10">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col items-center text-center">
                    <h1 
                        className="text-2xl font-black text-red-600 tracking-wider uppercase select-none"
                    >
                        Cineflix
                    </h1>
                    <p className="max-w-md mx-auto my-4 drop-shadow-sm">
                        Disclaimer: This site is for demonstration purposes only and does not host any files on its server. All content is provided by non-affiliated third parties.
                    </p>
                    <div className="flex justify-center mt-4 space-x-6">
                        {socialLinks.map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                onClick={social.onClick}
                                target={social.onClick ? undefined : "_blank"}
                                rel={social.onClick ? undefined : "noopener noreferrer"}
                                aria-label={social.name}
                                className={`text-slate-400 dark:text-slate-500 transition-all duration-300 transform hover:-translate-y-1 ${social.color} hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.7)] cursor-pointer`}
                            >
                                <social.icon className="w-8 h-8" />
                            </a>
                        ))}
                    </div>
                </div>
                <hr className="my-8 border-gray-300 dark:border-gray-800" />
                <div className="flex flex-col items-center sm:flex-row sm:justify-between">
                    <p className="text-sm drop-shadow-sm">
                        &copy; {new Date().getFullYear()} Cineflix. All Rights Reserved.
                    </p>
                    <p className="text-sm mt-4 sm:mt-0 font-semibold drop-shadow-sm">
                        Site Owner: <span className="text-red-500">RAJ</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
