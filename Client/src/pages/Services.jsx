// frontend/src/pages/Services.jsx
import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaExchangeAlt, FaChalkboardTeacher, FaUserGraduate, FaProjectDiagram, FaLightbulb, FaHandsHelping } from "react-icons/fa";

function Services() {
  const services = [
    {
      title: "Skill Exchange",
      description:
        "Connect with people who have the skills you want to learn, and teach what you know.",
      icon: <FaExchangeAlt className="text-4xl text-blue-600 mb-4" />,
    },
    {
      title: "Workshops",
      description:
        "Join live workshops conducted by experts to improve your skills and gain practical knowledge.",
      icon: <FaChalkboardTeacher className="text-4xl text-blue-600 mb-4" />,
    },
    {
      title: "Mentorship",
      description:
        "Get personalized guidance and mentorship from experienced professionals in your field.",
      icon: <FaUserGraduate className="text-4xl text-blue-600 mb-4" />,
    },
    {
      title: "Project Collaboration",
      description:
        "Collaborate on projects with other learners to gain hands-on experience.",
      icon: <FaProjectDiagram className="text-4xl text-blue-600 mb-4" />,
    },
    {
      title: "Idea Incubation",
      description:
        "Bring your innovative ideas to life with guidance and support from industry experts.",
      icon: <FaLightbulb className="text-4xl text-blue-600 mb-4" />,
    },
    {
      title: "Community Support",
      description:
        "Join a vibrant community to ask questions, get feedback, and network with like-minded learners.",
      icon: <FaHandsHelping className="text-4xl text-blue-600 mb-4" />,
    },
    {
      title: "Career Guidance",
      description:
        "Receive advice and resources to plan your career path effectively and reach your goals.",
      icon: <FaUserGraduate className="text-4xl text-blue-600 mb-4" />,
    },
    {
      title: "Resource Library",
      description:
        "Access a curated library of tutorials, templates, and learning resources to accelerate your growth.",
      icon: <FaChalkboardTeacher className="text-4xl text-blue-600 mb-4" />,
    },
  ];

  return (
    <>
      <Header />
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-center text-blue-900 mb-12 drop-shadow-md">
            Our Services
          </h1>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
              >
                {service.icon}
                <h2 className="text-xl font-semibold text-blue-800 mb-3">
                  {service.title}
                </h2>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>

          {/* Optional Call-to-Action Section */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              Ready to Grow Your Skills?
            </h2>
            <p className="text-gray-700 mb-6">
              Join our platform today and take the first step towards mastering new skills, connecting with mentors, and collaborating on exciting projects!
            </p>
            <a
              href="/register"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Services;
