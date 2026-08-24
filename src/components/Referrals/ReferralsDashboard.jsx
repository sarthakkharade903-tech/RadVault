import React, { useState } from 'react';
import ReferralList from './ReferralList';
import TriageForm from './TriageForm';
import { MOCK_REFERRALS } from '../../data/mockReferrals';

export default function ReferralsDashboard({ onBack }) {
  const [isCreating, setIsCreating] = useState(false);
  const [referrals, setReferrals] = useState(MOCK_REFERRALS);

  const handleNewReferral = (newReferral) => {
    // Add new referral to the top of the list and switch back to list view
    setReferrals((prev) => [newReferral, ...prev]);
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <TriageForm
        onSubmit={handleNewReferral}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  return (
    <ReferralList
      referrals={referrals}
      onCreateNew={() => setIsCreating(true)}
      onBack={onBack}
    />
  );
}
