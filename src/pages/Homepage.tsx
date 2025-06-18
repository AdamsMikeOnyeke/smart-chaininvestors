import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Menu, X, Bitcoin, Shield, TrendingUp, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const plans = [
    {
      name: "Basic",
      price: "$300",
      duration: "30 days",
      roi: "15%",
      features: [
        "Minimum deposit: $300",
        "15% ROI in 30 days",
        "24/7 customer support",
        "Basic trading tools",
        "Mobile app access"
      ],
      color: "from-gray-600 to-gray-800"
    },
    {
      name: "Silver",
      price: "$1,000",
      duration: "30 days", 
      roi: "25%",
      features: [
        "Minimum deposit: $1,000",
        "25% ROI in 30 days",
        "Priority customer support",
        "Advanced trading tools",
        "Portfolio analytics",
        "Risk management tools"
      ],
      color: "from-gray-400 to-gray-600",
      popular: true
    },
    {
      name: "Gold",
      price: "$5,000",
      duration: "30 days",
      roi: "35%",
      features: [
        "Minimum deposit: $5,000",
        "35% ROI in 30 days",
        "VIP customer support",
        "Professional trading suite",
        "Advanced analytics",
        "Personal account manager",
        "Exclusive market insights"
      ],
      color: "from-yellow-400 to-yellow-600"
    }
  ];

  const faqs = [
    {
      question: "How does Bitcoin trading work on your platform?",
      answer: "Our platform provides secure, automated Bitcoin trading using advanced algorithms and market analysis. Simply deposit your funds, choose your investment plan, and our system handles the trading process to maximize returns."
    },
    {
      question: "What is the minimum deposit required?",
      answer: "The minimum deposit is $300 for our Basic plan. This makes Bitcoin investment accessible to users at different financial levels while ensuring sustainable returns."
    },
    {
      question: "How quickly can I withdraw my profits?",
      answer: "Withdrawals are processed within 24-48 hours. We maintain high liquidity to ensure you can access your funds and profits whenever needed."
    },
    {
      question: "Is my investment secure?",
      answer: "Yes, we use bank-level security measures including SSL encryption, cold storage for Bitcoin holdings, and multi-factor authentication to protect your investments and personal data."
    },
    {
      question: "Can I track my investment performance?",
      answer: "Absolutely! Our dashboard provides real-time tracking of your investment performance, profit/loss statements, and detailed analytics to help you make informed decisions."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, we provide 24/7 customer support through live chat, email, and phone. Our Silver and Gold plan members receive priority and VIP support respectively."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-green-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <img src="\file_000000003b4c6246bca1230474a913a2.png" alt="logo" />
              </div>
              <span className="text-2xl font-bold text-white">Smartchaininvestors</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-green-300 hover:text-green-400 transition-colors">Home</a>
              <a href="#about" className="text-green-300 hover:text-green-400 transition-colors">About</a>
              <a href="#plans" className="text-green-300 hover:text-green-400 transition-colors">Plans</a>
              <a href="#faq" className="text-green-300 hover:text-green-400 transition-colors">FAQ</a>
              <Link to="/auth">
                <Button className="bg-green-600 hover:bg-green-700 text-black">
                  Create Account
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-green-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-green-700 pt-4">
              <div className="flex flex-col space-y-4">
                <a href="#home" className="text-green-300 hover:text-green-400 transition-colors">Home</a>
                <a href="#about" className="text-green-300 hover:text-green-400 transition-colors">About</a>
                <a href="#plans" className="text-green-300 hover:text-green-400 transition-colors">Plans</a>
                <a href="#faq" className="text-green-300 hover:text-green-400 transition-colors">FAQ</a>
                <Link to="/auth">
                  <Button className="bg-green-600 hover:bg-green-700 text-black w-full">
                    Create Account
                  </Button>
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Trade Your <span className="text-green-400">Bitcoin</span> 
              <br />with Confidence
            </h1>
            <p className="text-xl md:text-2xl text-green-200 mb-8 max-w-2xl mx-auto">
              Join thousands of investors who trust Smartchaininvestors for secure, profitable Bitcoin trading with guaranteed returns.
            </p>
            <div className="flex justify-center">
              <Link to="/auth">
                <Button className="bg-green-600 hover:bg-green-700 text-black text-lg px-8 py-3">
                  Start Trading Now
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Hero Image - Updated to Bitcoin-related */}
          <div className="mt-16 relative">
            <img 
              src="https://images.unsplash.com/photo-1640161704729-cbe966a08476?auto=format&fit=crop&w=1200&q=80" 
              alt="Bitcoin Trading and Cryptocurrency Investment" 
              className="rounded-lg shadow-2xl mx-auto max-w-4xl w-full opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-black/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">About Smartchaininvestors</h2>
            <p className="text-xl text-green-200 max-w-3xl mx-auto">
              Leading the future of cryptocurrency investment since our founding
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Our Story</h3>
              <p className="text-green-200 mb-6">
                Founded in 2019 by a team of blockchain experts and financial analysts, Smartchaininvestors was born from the vision of making Bitcoin investment accessible, secure, and profitable for everyone.
              </p>
              <p className="text-green-200 mb-6">
                Starting with just a handful of investors, we've grown to serve thousands of clients worldwide, managing over $50 million in Bitcoin investments with a proven track record of consistent returns.
              </p>
              <p className="text-green-200">
                Our cutting-edge trading algorithms, combined with deep market expertise, have delivered industry-leading performance while maintaining the highest security standards.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-green-700">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white">10,000+</h4>
                  <p className="text-green-200">Active Investors</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-green-700">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white">150%</h4>
                  <p className="text-green-200">Average Annual Return</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-green-700">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white">100%</h4>
                  <p className="text-green-200">Security Record</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-green-700">
                <CardContent className="p-6 text-center">
                  <Bitcoin className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white">$50M+</h4>
                  <p className="text-green-200">Managed Assets</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans */}
      <section id="plans" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Investment Plans</h2>
            <p className="text-xl text-green-200 max-w-3xl mx-auto">
              Choose the perfect plan for your Bitcoin investment journey. All plans include guaranteed returns and secure trading.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`bg-gray-900 border-green-700 relative ${plan.popular ? 'border-2 border-green-400' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} mx-auto mb-4 flex items-center justify-center`}>
                    <Bitcoin className="text-white text-2xl" />
                  </div>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-green-200">
                    {plan.roi} ROI in {plan.duration}
                  </CardDescription>
                  <div className="text-4xl font-bold text-green-400">{plan.price}</div>
                  <p className="text-green-200">Minimum Deposit</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-green-200">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/auth">
                    <Button className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
                      Choose {plan.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-black/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-green-200 max-w-3xl mx-auto">
              Get answers to the most common questions about Bitcoin trading and our investment platform.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-gray-900 border-green-700 rounded-lg px-6">
                  <AccordionTrigger className="text-white hover:text-green-400 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-green-200 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-green-700 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <img src="\file_000000003b4c6246bca1230474a913a2.png" alt="logo" />
                </div>
                <span className="text-2xl font-bold text-white">Smartchaininvestors</span>
              </div>
              <p className="text-green-200 mb-4 max-w-md">
                Your trusted partner in Bitcoin investment. Secure, profitable, and transparent trading since 2019.
              </p>
              <p className="text-green-200 text-sm">
                Making cryptocurrency investment accessible to everyone, everywhere.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#home" className="text-green-200 hover:text-green-400 transition-colors">Home</a></li>
                <li><a href="#about" className="text-green-200 hover:text-green-400 transition-colors">About</a></li>
                <li><a href="#plans" className="text-green-200 hover:text-green-400 transition-colors">Plans</a></li>
                <li><a href="#faq" className="text-green-200 hover:text-green-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4">Get Started</h4>
              <Link to="/auth">
                <Button className="bg-green-600 hover:bg-green-700 text-black w-full mb-4">
                  Create Account
                </Button>
              </Link>
              <p className="text-green-200 text-sm">
                Join thousands of successful Bitcoin investors today.
              </p>
            </div>
          </div>

          <div className="border-t border-green-700 mt-8 pt-8 text-center">
            <p className="text-green-200">
              © {new Date().getFullYear()} Smartchaininvestors. All rights reserved. | Empowering Your Bitcoin Investment Journey
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
