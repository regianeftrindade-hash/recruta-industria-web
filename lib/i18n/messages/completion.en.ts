/** English strings for completionMessages keys. */
export const completionMessagesEn: Record<string, string> = {
  "auth.googleSignIn": "Sign in with Google",
  "ui.opening": "Opening...",
  "ui.openingSubscription": "Opening subscription...",
  "ui.checkingSubscription": "Checking subscription...",
  "ui.openingCheckout": "Opening checkout...",
  "ui.openingProfile": "Opening profile...",
  "ui.redirectingSecureCheckout": "Redirecting to secure checkout...",

  "welcome.loading": "Preparing your welcome...",
  "welcome.pro.title": "Welcome{name}!",
  "welcome.pro.subtitle": "Your registration was completed successfully.",
  "welcome.pro.messageTitle": "You are already in the industrial showcase",
  "welcome.pro.messageBody":
    "Companies in your area can now find your profile. Keep your details up to date, highlight your qualifications, and follow opportunities from your professional dashboard.",
  "welcome.pro.step1Title": "Review your profile",
  "welcome.pro.step1Body": "Check that your photo, education, and experience are complete.",
  "welcome.pro.step2Title": "Personal profile",
  "welcome.pro.step2Body":
    "Take the personal assessment in the dashboard to show how you work day to day.",
  "welcome.pro.step3Title": "Wait for contact",
  "welcome.pro.step3Body":
    "Interested companies can view your profile and get in touch.",
  "welcome.pro.step4Title": "Follow the dashboard",
  "welcome.pro.step4Body":
    "See messages, update your details, and keep your profile active.",
  "welcome.pro.cta": "Go to my dashboard",
  "welcome.pro.note":
    "You can update your registration anytime from the professional dashboard.",

  "welcome.company.title": "Welcome{name}!",
  "welcome.company.subtitle": "Your company registration was completed successfully.",
  "welcome.company.messageTitle": "Your company can already recruit on the platform",
  "welcome.company.messageBody":
    "Use the showcase to find industrial professionals. Contacts and sensitive data unlock after you confirm the corporate email and CNPJ card approval.",
  "welcome.company.step1Title": "Search for talent",
  "welcome.company.step1Body":
    "Filter by region, area, and experience in the industrial showcase.",
  "welcome.company.step2Title": "Confirm and verify",
  "welcome.company.step2Body":
    "Confirm the corporate email and submit the CNPJ card to unlock contacts.",
  "welcome.company.step3Title": "Get in touch",
  "welcome.company.step3Body":
    "Unlock profiles and talk to candidates from the company dashboard.",
  "welcome.company.step4Title": "Follow the funnel",
  "welcome.company.step4Body":
    "Mark contacted, interviewed, and hired candidates in tracking.",
  "welcome.company.cta": "Go to the company dashboard",
  "welcome.company.note":
    "Contacts and proposals require verification (email + CNPJ) and a paid plan. You can update registration anytime from the dashboard.",
  "welcome.company.loadingFallback": "Loading...",

  "pay.status.waitingPix": "Waiting for Pix confirmation...",
  "pay.status.confirmedPremium": "Payment confirmed. Unlocking Premium...",
  "pay.status.notApprovedRetry": "Payment was not approved. Please try again.",
  "pay.status.verifyError": "Could not check status. Try again.",
  "pay.status.fillNameEmail": "Enter name and email.",
  "pay.status.generatingPix": "Creating Pix charge...",
  "pay.status.pixError": "Could not create Pix.",
  "pay.status.pixGenerated": "Pix created. Pay and we will wait for confirmation...",
  "pay.status.boletoGenerated": "Bank slip created. Waiting for payment...",
  "pay.status.checkoutCreated": "Checkout created.",
  "pay.status.unexpected": "Unexpected error starting payment.",
  "pay.status.verifying": "Checking payment...",
  "pay.status.confirmedActivatingPremium": "✅ Payment confirmed! Activating Premium...",
  "pay.status.confirmedActivatingPlan": "✅ Payment confirmed! Activating plan...",
  "pay.status.notApproved": "❌ Payment was not approved.",
  "pay.status.verifyPaymentError": "Could not verify payment.",
  "pay.status.generatingCharge": "Creating charge...",
  "pay.status.chargeError": "Charge failed. Please try again.",
  "pay.status.activatePlanError": "Could not activate plan",
  "pay.status.checkoutCanceled":
    "Checkout canceled. You can try again whenever you want.",
  "pay.status.receivedConfirming": "Payment received. Confirming plan activation...",
  "pay.premium.paused":
    "New Premium sign-ups are paused. The free plan remains available.",
  "pay.premium.badge": "PROFESSIONAL PREMIUM",
  "pay.premium.blurb":
    "Unlock all site features, premium tips, visit history, and greater visibility to companies.",
  "pay.premium.feature1": "All site features unlocked",
  "pay.premium.feature2":
    "See which companies viewed your profile and all tips on your profile",
  "pay.premium.feature3": "Premium tips without lock",
  "pay.premium.feature4": "Detailed visit history",
  "pay.premium.feature5": "Featured profile for companies",
  "pay.premium.feature6": "Priority support",
  "pay.chooseMethod": "Choose a method and complete the Premium subscription.",
  "pay.backHome": "Back to home",

  "legal.officialTranslationPending":
    "Official legal translation pending validation. Showing the Brazilian Portuguese text.",
  "legal.structureReadyNotice":
    "The multi-language structure is ready; legal body text is added only after legal review — we do not invent official translations.",

  "pay.status.waitingBoletoLeave": "Waiting for bank slip confirmation. You can leave this page — we activate the plan when payment clears.",
  "pay.status.waitingPayment": "Waiting for payment confirmation...",
  "pay.status.stillWaitingBoletoPremium": "Still waiting for the bank slip. You can close this page; when payment is confirmed, Premium activates automatically. Use “Check now” to check again.",
  "pay.status.stillWaitingBoletoPlan": "Still waiting for the bank slip. You can close this page; when payment is confirmed, the plan activates automatically. Use “Check now” to check again.",
  "pay.status.stillWaitingPix": "We have not seen Pix confirmation yet. Use “Check now” or choose another payment method.",
  "pay.status.notConfirmedBoleto": "Not confirmed yet. Bank slips can take 1–2 business days — you can leave; we activate the plan when it clears.",
  "pay.status.notConfirmedPix": "Not confirmed yet. If you already paid with Pix, wait a few seconds and try again.",
  "pay.status.temporarilyUnavailable": "Payment temporarily unavailable. Try again in a few minutes or contact support.",
  "pay.status.couldNotCreateCharge": "Could not create the charge.",
  "pay.status.subscriptionLookupFailed": "Could not load the subscription. Premium is activated only after payment confirmation.",
  "pay.status.webhookActivationPending": "Payment recorded. Activation may take a few seconds (webhook). Refresh the dashboard shortly.",
  "pay.status.annualIntlUnavailable": "International annual billing is not available yet. Choose the monthly plan or try later.",
  "pay.access.declined": "Payment declined or not completed",
  "pay.access.canceled": "Payment canceled or not completed",
  "pay.cta.payCard": "Pay by card · {price}{period}",
  "pay.cta.subscribe": "Subscribe {price}{period}",
  "pay.cta.generatePix": "Generate Pix · {price}",
  "pay.cta.generateBoleto": "Generate bank slip · {price}",
  "pay.cta.subscribePlan": "{emoji} Subscribe to {name}",
  "pay.cta.processing": "Processing...",
  "pay.cta.regeneratePix": "Regenerate Pix",
  "pay.cta.regenerateBoleto": "Regenerate bank slip",
  "pay.cta.openCheckout": "Open checkout",
  "pay.cta.generatePixPagseguro": "Generate Pix with PagSeguro",
  "pay.cta.generateBoletoSimple": "Generate bank slip",
  "pay.cta.startCheckout": "Start checkout",
  "ui.loadingShort": "Loading...",
};
