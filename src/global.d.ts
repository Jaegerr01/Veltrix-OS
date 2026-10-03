import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ConvaiProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { 'agent-id'?: string };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': ConvaiProps;
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'elevenlabs-convai': ConvaiProps;
      }
    }
  }
}
