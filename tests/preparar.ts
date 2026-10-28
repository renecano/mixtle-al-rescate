import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';

// En las pruebas las animaciones no aportan nada, y happy-dom rechaza las que se cancelan al desmontar.
MotionGlobalConfig.skipAnimations = true;

// Sin "globals" de Vitest, Testing Library no limpia sola el DOM entre pruebas.
afterEach(() => cleanup());
