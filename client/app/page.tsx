import {
  Hero,
  Header,
  Feature,
  Footer,
  Offer,
  Question,
} from '@/components/landing/home'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Feature />
        <Offer />
        <Question />
      </main>
      <Footer />
    </>
  )
}
