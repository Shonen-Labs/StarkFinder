"use client"

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import star from '@/public/img/star.svg'
import star2 from '@/public/img/star2.svg'
import star3 from '@/public/img/star3.svg'
import bgTop from '@/public/img/top.png'
import bgLeft from '@/public/img/left.png'
import { SectionBackground } from './landing/home/section-background'
import { MotionBox } from './landing/home/motion-box'
import { useState } from 'react'

export function NewsletterForm() {
    const [email, setEmail] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Subscribed with:', email)
        // Handle the subscription logic here
    }

    return (
        <section
            id="newsletter"
            className="pt-[6rem] bg-purple-light px-4 scroll-mt-[1.25rem] relative overflow-x-clip"
        >
            <SectionBackground id="particles-newsletter" />
            <div className="flex justify-center items-center">
                <MotionBox className="relative mb-[4rem] z-10">
                    <Image
                        src={star}
                        alt="bg-title"
                        className="absolute -left-[1.875rem] -top-[0.938rem]"
                    />
                    <Image
                        src={star2}
                        alt="bg-title"
                        className="absolute -left-[0.625rem] -bottom-[2.188rem]"
                    />
                    <Image
                        src={star3}
                        alt="bg-title"
                        className="absolute -top-[2.813rem] -right-[3.938rem]"
                    />
                    <h2 className="text-orange-bright font-bold leading-none text-center text-[2.5rem] md:text-lp-h2">
                        Subscribe to Our Newsletter
                    </h2>
                </MotionBox>
            </div>

            <div className="max-w-[50rem] mx-auto relative z-10 text-center pb-16">
                <p className="pb-6 text-lp-text text-grayscale-100">
                    Stay updated with the latest news, insights, and special offers.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                        }}
                        placeholder="Enter your email"
                        className="px-4 py-3 rounded-lg w-full md:w-[25rem] bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-bright"
                        required
                        aria-label="Email address"
                    />
                    <Button type="submit" size="landing-lg" variant="primary" className="mt-6 md:mt-0">
                        Subscribe
                    </Button>
                </form>
            </div>

            <Image src={bgLeft} alt="bg-title" className="absolute bottom-0 left-0" />
            <Image
                src={bgTop}
                alt="bg-title"
                className="absolute -top-[23.75rem] right-0"
            />
        </section>
    )
}
