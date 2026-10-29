import React, { useState } from 'react';
import Header from '@/components/Header';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import Hero from '@/components/Hero';
import QuoteBuilder, { QuoteDetails } from '@/components/QuoteBuilder';
import ConsultationCTA from '@/components/ConsultationCTA';
import DesignGallery from '@/components/DesignGallery';
import LeadModal from '@/components/LeadModal';
import DepositCheckout from '@/components/DepositCheckout';
import Footer from '@/components/Footer';
import EventsTicker from '@/components/EventsTicker';
import HoldMyDate from '@/components/HoldMyDate';

const AppLayout: React.FC = () => {
  const [leadOpen, setLeadOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [details, setDetails] = useState<QuoteDetails | null>(null);

  const scrollToBuilder = () =>
    document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' });

  const handleRequestQuote = (d: QuoteDetails) => {
    setDetails(d);
    setLeadOpen(true);
  };

  const handlePayDeposit = (d: QuoteDetails) => {
    setDetails(d);
    setDepositOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fbf7f0] font-sans">
      <Header onPlan={scrollToBuilder} />
      <Hero onPlan={scrollToBuilder} />
      <EventsTicker />
      <TestimonialsCarousel />
      <HoldMyDate onBuildQuote={scrollToBuilder} />
      <QuoteBuilder onRequestQuote={handleRequestQuote} onPayDeposit={handlePayDeposit} />
      <DesignGallery
        onConsult={() =>
          document.getElementById('consultation')?.scrollIntoView({ behavior: 'smooth' })
        }
      />
      <ConsultationCTA />
      <Footer />

      <LeadModal
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        breakdown={details?.breakdown ?? null}
        eventTypeLabel={details?.eventTypeLabel ?? ''}
        guests={details?.guests ?? 0}
        sizes={details?.sizes ?? []}
        quoteNotes={details?.notes ?? ''}
        initialEventDate={details?.eventDate ?? ''}
      />

      <DepositCheckout
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        breakdown={details?.breakdown ?? null}
        eventTypeLabel={details?.eventTypeLabel ?? ''}
        guests={details?.guests ?? 0}
        hours={details?.hours ?? 0}
        serviceAddons={details?.serviceAddons ?? []}
        customAddons={details?.customAddons ?? []}
        initialEventDate={details?.eventDate ?? ''}
        eventStartTime={details?.eventStartTime ?? ''}
        eventEndTime={details?.eventEndTime ?? ''}
        hatStyle={details?.hatStyle ?? ''}
        eventVenue={details?.eventVenue ?? ''}
        eventCity={details?.eventCity ?? ''}
        eventLocation={details?.eventLocation ?? ''}
        company={details?.company ?? ''}
        flexibleDates={details?.flexibleDates ?? false}
        displayTotal={details?.displayTotal ?? 0}
        displayDeposit={details?.displayDeposit ?? 0}
        hatPricePerGuest={details?.hatPricePerGuest ?? 0}
        hearAboutUs={details?.hearAboutUs ?? ''}
        sourceLink={details?.sourceLink ?? ''}
        notes={details?.notes ?? ''}
      />
    </div>
  );
};

export default AppLayout;
