
// Helper function for gamma function calculation
export function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z = z - 1;
  let x = 0.99999999999980993;
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  
  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Helper function for beta function calculation
export function beta(x: number, y: number): number {
  return (gamma(x) * gamma(y)) / gamma(x + y);
}
