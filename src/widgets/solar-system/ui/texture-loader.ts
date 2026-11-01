"use client";

import { useEffect, useState } from 'react';
import { SRGBColorSpace, Texture, TextureLoader } from 'three';

export function useOptionalTexture(path: string) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new TextureLoader();
    const loadedTexture = loader.load(
      path,
      (loaded) => {
        loaded.colorSpace = SRGBColorSpace;
        loaded.anisotropy = 8;
        if (active) setTexture(loaded);
      },
      undefined,
      () => {
        if (active) setTexture(null);
      },
    );

    return () => {
      active = false;
      loadedTexture.dispose();
    };
  }, [path]);

  return texture;
}
