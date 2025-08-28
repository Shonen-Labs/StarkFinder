import Footer from "../../footer/footer";
import Hero from "../../hero/hero";
import Navbar from "../../navbar/navbar";
import Security from "../../security/security";
import Feature from "../../feature/feature";
import Workings from "../../workings/workings";
import FAQpage from "../../faq/faq";
import ContactUs from "@/components/contactUs/contactUs";
import HowItWorks from "@/components/howto/howto";


export default function Homepage(){
    return (
        <>
        <Navbar/>
        <Hero/>   
         <HowItWorks/>
        <Workings/>
        <Feature/>
        <Security/>
        <FAQpage/>
        <ContactUs/>
        <Footer/>
        </>
    )
}