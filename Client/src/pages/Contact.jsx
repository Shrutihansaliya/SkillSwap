import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

function Contact() {
  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 py-16 px-6 md:px-20">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-10">
          <h1 className="text-3xl font-bold text-blue-900 mb-6">Contact Us</h1>

          {/* Paragraphs */}
          <div className="text-gray-700 space-y-4 mb-8">
            <p>
              Welcome to SkillSwap! Our mission is to connect learners and experts 
              across the globe, providing a platform where skills can be shared and knowledge exchanged freely. 
              We are committed to helping everyone reach their full potential.
            </p>

            <p>
              Whether you have questions about our platform, want to give feedback, 
              or need help with a specific skill, our support team is always ready to assist you. 
              We value your input and strive to respond promptly to all inquiries.
            </p>

            <p>
              SkillSwap is proud to serve individuals, schools, and organizations looking 
              to expand their learning horizons. We continuously update our platform 
              with new features and resources based on your feedback.
            </p>

            <p>
              Reach out to us through any of the channels below, or follow us on social media 
              to stay updated with the latest news and tips from SkillSwap.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 text-gray-700">
            <div className="flex items-center gap-4">
              <FaPhone className="text-blue-500 w-6 h-6" />
              <span>+91 98765 43210</span>
            </div>

            <div className="flex items-center gap-4">
              <FaEnvelope className="text-blue-500 w-6 h-6" />
              <span>support@skillswap.com</span>
            </div>

            <div className="flex items-center gap-4">
              <FaMapMarkerAlt className="text-blue-500 w-6 h-6" />
              <span>123 SkillSwap Street, Mumbai, India</span>
            </div>

           
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Contact;
