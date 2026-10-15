export const faiths = ['Universal', 'Christian', 'Catholic', 'Islamic'];
export const tones = ['Warm', 'Elegant', 'Playful', 'Poetic', 'Minimal'];
export const presets = ['baby', 'thinking'];
const baby = {
  Warm: 'May your little one grow surrounded by tenderness, and may you find joy in the small, beautiful moments of becoming a family.',
  Elegant: 'May this new life be welcomed with grace, cherished with patience, and guided by enduring love.',
  Playful: 'Here’s to tiny toes, sleepy cuddles, and a whole new kind of adventure. May your home overflow with laughter and love.',
  Poetic: 'A new light arrives, soft as dawn. May love be the sky beneath which this little life unfolds.',
  Minimal: 'May your little one know safety, joy, and a lifetime of love.'
};
const thinking = {
  Warm: 'You have been on my mind today. I miss the ordinary moments we share, and I’m sending a little warmth across the distance.',
  Elegant: 'Across the distance, you remain a treasured part of my days. May this small note bring you warmth and peace.',
  Playful: 'A tiny delivery of affection, with absolutely no postage required. Wish you were here to share a smile with me.',
  Poetic: 'Between our separate skies, a quiet thread of care remains. Today, I’m sending a little light along it to you.',
  Minimal: 'Thinking of you. Missing you. Sending love from here.'
};
const faith = {
  Universal: '',
  Christian: ' May God’s love surround you and Christ’s peace be with you.',
  Catholic: ' May God bless you, and may Mary’s gentle care accompany you.',
  Islamic: ' May Allah bless you with peace, mercy, and goodness.'
};
/** Provider contract: async generate(input) and async script(input, result).
 * A future server-backed LLM adapter must return this same shape. Never put API keys in the browser. */
export const templateProvider = {
  async generate(input) {
    if (!presets.includes(input.preset) || !faiths.includes(input.faith) || !tones.includes(input.tone)) throw new Error('Unsupported selection');
    const isBaby = input.preset === 'baby';
    return {
      title: isBaby ? 'A little life, a world of love' : 'A little light, sent to you',
      theme: isBaby ? 'dawn' : 'twilight',
      blessing: `${input.recipient ? `Dear ${input.recipient},\n\n` : ''}${(isBaby ? baby : thinking)[input.tone]}${faith[input.faith]}${input.detail ? `\n\n${input.detail}` : ''}`,
      keepsake: isBaby ? 'Small beginnings. Boundless love.' : 'You are close to my heart, wherever you are.',
      sender: input.sender || '', script: ''
    };
  },
  async script(input, result) {
    return `Hi${input.recipient ? ` ${input.recipient}` : ''}. I wanted to send you a few words today.\n\n${result.blessing.replace(/^Dear [^\n]+,\n\n/, '')}\n\n${result.keepsake}\n\nWith love${input.sender ? `, ${input.sender}` : ''}.`;
  }
};
