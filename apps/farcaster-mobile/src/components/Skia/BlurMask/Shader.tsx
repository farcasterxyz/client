import { Skia } from '@shopify/react-native-skia';

import { logInDevOnly } from '~/utils/LogUtils';

type Value = string | number;
type Values = Value[];

export const glsl = (source: TemplateStringsArray, ...values: Values) => {
  const processed = source.flatMap((s, i) => [s, values[i]]).filter(Boolean);
  return processed.join('');
};

export const generateShader = () => {
  const maxSigma = 24;
  const k = 6; // Slightly reduced for better performance
  const windowSize = k * maxSigma;
  const halfWindowSize = (windowSize / 2).toFixed(1);

  logInDevOnly('Generating high quality shader', { maxSigma, k, windowSize });

  const source = glsl`
uniform shader image;
uniform shader mask;

uniform float2 direction;
uniform float2 imageSize;
uniform float3 gradientColor;
uniform float gradientStrength;

// Function to calculate Gaussian weight
float Gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (2.0 * 3.14159 * sigma * sigma);
}

// Function to apply gradient overlay to a color
vec3 applyGradient(vec3 color, vec2 uv) {
  // Calculate gradient alpha based on vertical position (0 at top, 1 at bottom)
  float gradientAlpha = (uv.y / imageSize.y) * gradientStrength;
  
  // Alpha blend: mix original color with gradient color based on gradient alpha
  return mix(color, gradientColor, gradientAlpha);
}

// Function to perform blur in one direction
vec3 blur(vec2 uv, vec2 direction, float sigma) {
  vec3 result = vec3(0.0);
  float totalWeight = 0.0;
  float window = sigma * ${k.toFixed(1)} * 0.5;

  for (float i = ${-halfWindowSize}; i <= ${halfWindowSize}; i++) {
      if (abs(i) > window) {
        continue;
      }
      float weight = Gaussian(i, sigma);
      vec2 offset = vec2(direction * i);
      vec3 sample = image.eval(uv + offset).rgb;

      result += sample * weight;
      totalWeight += weight;
  }

  if (totalWeight > 0.0) {
      result /= totalWeight;
  }

  return result;
}

// main function
vec4 main(vec2 fragCoord) {
  float amount = mask.eval(fragCoord).a;
  vec3 originalColor = image.eval(fragCoord).rgb;
  
  if (amount == 0.0) {
    return vec4(originalColor, 1.0);
  }
  
  // Apply blur
  vec3 blurredColor = blur(fragCoord, direction, mix(0.1, ${maxSigma.toFixed(
    1,
  )}, amount));
  
  // Apply gradient overlay based on mask amount
  // Gradient alpha goes from 0 at top to gradientStrength at bottom
  float gradientAlpha = (fragCoord.y / imageSize.y) * gradientStrength * amount;
  
  // Mix the blurred color with the gradient color based on the gradient's alpha
  vec3 finalColor = mix(blurredColor, gradientColor, gradientAlpha);
  
  return vec4(finalColor, 1.0);
}
`;
  const effect = Skia.RuntimeEffect.Make(source);
  if (!effect) {
    logInDevOnly('Failed to compile blur shader', { source });
    throw new Error('Failed to compile blur shader');
  }
  return effect;
};

// Ultra-optimized shader for older devices with stronger blur
export const generateLowQualityShader = () => {
  const source = glsl`
uniform shader image;
uniform shader mask;
uniform float2 direction;
uniform float2 imageSize;
uniform float3 gradientColor;
uniform float gradientStrength;

// Function to apply gradient overlay to a color
vec3 applyGradient(vec3 color, vec2 uv) {
  // Calculate gradient alpha based on vertical position (0 at top, 1 at bottom)
  float gradientAlpha = (uv.y / imageSize.y) * gradientStrength;
  
  // Alpha blend: mix original color with gradient color based on gradient alpha
  return mix(color, gradientColor, gradientAlpha);
}

vec4 main(vec2 fragCoord) {
  float amount = mask.eval(fragCoord).a;
  vec3 originalColor = image.eval(fragCoord).rgb;
  
  // Early exit for very low blur amounts
  if (amount < 0.05) {
    return vec4(originalColor, 1.0);
  }
  
  // 9-tap blur with optimized sampling pattern for stronger effect
  vec3 color = vec3(0.0);
  float totalWeight = 0.0;
  
  // Larger radius for more visible blur
  float radius = amount * 12.0; // Increased from 2.0 to 12.0
  
  // Optimized 9-tap Gaussian approximation
  // Weights approximating a Gaussian distribution
  float weights[5] = float[5](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  
  // Center sample
  color += originalColor * weights[0];
  totalWeight += weights[0];
  
  // Take 4 samples on each side with decreasing weights
  for (int i = 1; i <= 4; i++) {
    float offset = float(i) * radius * 0.5; // Sample at half intervals for better coverage
    vec3 sample1 = image.eval(fragCoord + direction * offset).rgb;
    vec3 sample2 = image.eval(fragCoord - direction * offset).rgb;
    
    color += (sample1 + sample2) * weights[i];
    totalWeight += weights[i] * 2.0;
  }
  
  vec3 blurredColor = color / totalWeight;
  
  // Apply gradient overlay based on mask amount
  // Gradient alpha goes from 0 at top to gradientStrength at bottom
  float gradientAlpha = (fragCoord.y / imageSize.y) * gradientStrength * amount;
  
  // Mix the blurred color with the gradient color based on the gradient's alpha
  vec3 finalColor = mix(blurredColor, gradientColor, gradientAlpha);
  
  return vec4(finalColor, 1.0);
}
`;
  const effect = Skia.RuntimeEffect.Make(source);
  if (!effect) {
    logInDevOnly('Failed to compile blur shader', { source });
    throw new Error('Failed to compile blur shader');
  }
  return effect;
};
