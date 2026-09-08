import React, { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import QuoteBuilder, { QuoteDetails } from '@/components/QuoteBuilder';
import ConsultationCTA from '@/components/ConsultationCTA';
import DesignGallery from '@/components/DesignGallery';
import LeadModal from '@/components/LeadModal';
import DepositCheckout from '@/components/DepositCheckout';
import Footer from '@/components/Footer';


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
      />

    </div>
  );
};

export default AppLayout;
