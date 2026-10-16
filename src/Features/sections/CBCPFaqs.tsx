import { useState, useCallback } from 'react';
import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import Image from '../../components/image';
import { MotionViewport, varFade, varZoom } from '../../components/animate';
import { useResponsive } from '../../hooks/use-responsive';
import { useFaqs, withFallback } from '../../hooks/queries/content';

const FALLBACK_FAQS = [
  {
    id: '1',
    question: 'Can I order a custom piece?',
    answer: "Absolutely! Custom commissions are open. Whether you want a custom painting, a unique sticker design, or a personalized print, reach out through the contact form and we'll discuss the details, timeline, and pricing.",
  },
  {
    id: '2',
    question: 'Where can I find your socials?',
    answer: "You can find Creepy But Cute Press on Instagram, TikTok, Etsy, and Pinterest. Links are in the header and footer — follow along for new work, behind-the-scenes content, restocks, and flash sales.",
  },
  {
    id: '3',
    question: 'What inspires your art?',
    answer: "The liminal space between cute and unsettling — folklore, horror, nature, and pop culture all filtered through a personal and deeply strange lens. If it makes you feel something weird and wonderful at the same time, that's exactly the goal.",
  },
  {
    id: '4',
    question: 'How long does a custom order take?',
    answer: "Custom pieces typically take 2–4 weeks depending on complexity and current workload. You'll receive a specific timeline when we discuss your commission, and updates throughout the process.",
  },
  {
    id: '5',
    question: 'Do you ship internationally?',
    answer: 'Yes! Creepy But Cute Press ships worldwide. Shipping rates and estimated delivery times vary by location and will be calculated at checkout.',
  },
  {
    id: '6',
    question: 'What makes your art different from other artists?',
    answer: "Every piece is made with genuine passion for the weird and wonderful. This isn't mass-produced art — it's personal, peculiar, and made with care. The aesthetic sits in a very specific space that you simply won't find anywhere else.",
  },
];

export default function CBCPFaqs() {
  const mdUp = useResponsive('up', 'md');
  const FAQS = withFallback(useFaqs().data, FALLBACK_FAQS);
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = useCallback(
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  return (
    <Box sx={{ bgcolor: 'secondary.main' }}>
      <Container component={MotionViewport} sx={{ pt: { xs: 5, md: 10 }, pb: { xs: 10, md: 15 } }}>
        <Box
          sx={{
            display: { md: 'flex' },
            gap: 3,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: { md: '52%' } }}>
            <Stack spacing={2} sx={{ mb: 5, textAlign: { xs: 'center', md: 'left' } }}>
              <Box component={m.div} variants={varFade().inUp}>
                <Typography variant="overline" color="text.disabled">
                  FAQs
                </Typography>
              </Box>
              <Box component={m.div} variants={varFade().inUp}>
                <Typography variant="h2">Frequently Asked Questions</Typography>
              </Box>
            </Stack>

            {FAQS.map((faq) => (
              <Accordion
                component={m.div}
                variants={varFade().inUp}
                key={faq.id}
                expanded={expanded === faq.question}
                onChange={handleChange(faq.question)}
                sx={{
                  bgcolor: 'transparent',
                  color: 'text.primary',
                  boxShadow: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  border: 'none'
                }}
              >
                <AccordionSummary
                  sx={{
                    minHeight: 64,
                    [`& .${accordionSummaryClasses.content}`]: { p: 0, m: 0 },
                    [`&.${accordionSummaryClasses.expanded}`]: { bgcolor: 'secondary.main' },
                    border: 'none'
                  }}
                >
                  <Typography variant="h6" sx={{ flexGrow: 1, border: 'none' }}>
                    {faq.question}
                  </Typography>
                  {expanded === faq.question ? (
                    <RemoveIcon sx={{ fontSize: 24 }} />
                  ) : (
                    <AddIcon sx={{ fontSize: 24 }} />
                  )}
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'secondary.main' }}>
                  {/*
                    The app doesn't use CssBaseline, so there's no global
                    font-family reset — plain text here falls back to the
                    browser's default serif font instead of the theme's
                    Roboto. Wrapping it in Typography is what actually
                    applies the theme font.
                  */}
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {mdUp && (
            <Box
              component={m.div}
              variants={varZoom().in}
              sx={{ width: '40%', bgcolor: 'secondary.main' }}
            >
              <Image alt="FAQs" src="/assets/illustrations/illustration_faqs_questions.svg" />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
