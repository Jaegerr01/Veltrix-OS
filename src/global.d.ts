import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': any;
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'elevenlabs-convai': any;
      }
    }
  }
}
