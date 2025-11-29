import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function About() {
  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 py-16 px-6 md:px-20">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-8">About SkillSwap</h1>

          <p className="text-gray-700 mb-6">
            SkillSwap is an innovative platform designed to connect people from all over the world to learn and share skills. 
            Whether you are looking to master a new hobby, develop professional expertise, or teach your unique abilities, 
            SkillSwap makes it easy to connect with the right people at the right time.
          </p>

          <h2 className="text-2xl font-semibold text-blue-800 mt-6 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-6">
            Our mission is to create a thriving community of learners and educators, 
            empowering everyone to expand their knowledge, build confidence, and achieve personal growth.
            We believe learning should be accessible, engaging, and collaborative.
          </p>

          <h2 className="text-2xl font-semibold text-blue-800 mt-6 mb-4">Key Features</h2>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
            <li>Connect with skilled individuals for personalized learning experiences.</li>
            <li>Offer your own skills and earn recognition while teaching others.</li>
            <li>Track your progress and set learning goals to stay motivated.</li>
            <li>Join communities of like-minded learners for collaboration and discussion.</li>
            <li>Access skill-sharing events, workshops, and interactive sessions online.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-blue-800 mt-6 mb-4">Why Choose SkillSwap?</h2>
          <p className="text-gray-700 mb-6">
            Unlike traditional learning platforms, SkillSwap focuses on peer-to-peer learning, 
            allowing you to gain real-world skills from experienced individuals. 
            Our intuitive platform ensures you can easily find, connect, and collaborate with others who share your learning interests.
          </p>

          <h2 className="text-2xl font-semibold text-blue-800 mt-6 mb-4">Community & Growth</h2>
          <p className="text-gray-700 mb-6">
            At SkillSwap, community is at the heart of everything we do. We encourage learners to interact, share experiences, and provide feedback. 
            By fostering a supportive environment, we ensure that everyone has the opportunity to grow both personally and professionally.
          </p>

          <p className="text-gray-700 mb-6">
            Join SkillSwap today and start your journey of learning, teaching, and connecting with a global community passionate about skills and knowledge.
          </p>

          <p className="text-gray-700 font-semibold text-center mt-8">
            Empower your skills, share your knowledge, and grow with SkillSwap!
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default About;
