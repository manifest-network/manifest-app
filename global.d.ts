import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }

  interface Window {
    __ENV__?: Record<string, string | undefined>;
    keplr?: any;
    ethereum?: any;
    leap?: any;
  }
}
