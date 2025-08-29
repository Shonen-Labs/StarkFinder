"use client";

import React, { FormEvent } from "react";

interface ContactUsProps {
  title?: string;            // Optional heading
  buttonText?: string;       // Optional button text
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void; // Custom submit handler
}

const ContactUs: React.FC<ContactUsProps> = ({
  title = "Contact Us",
  buttonText = "Send Message",
  onSubmit,
}) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    } else {
      alert("✅ Message submitted!");
    }
  };

  return (
    <section id="contact" className="max-w-3xl mx-auto px-6 py-12">
      {/* Section Title */}
      <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-green-200"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-green-200"
          required
        />
        <textarea
          name="message"
          placeholder="Your Message"
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-green-200"
          required
        ></textarea>

        <button
          type="submit"
          className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          {buttonText}
        </button>
      </form>
    </section>
  );
};

export default ContactUs;
