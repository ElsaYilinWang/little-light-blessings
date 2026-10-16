export const faiths = ['Universal', 'Christian', 'Catholic', 'Islamic'];
export const tones = ['Warm', 'Elegant', 'Playful', 'Poetic', 'Minimal'];
export const presets = ['baby', 'thinking'];
export const suggestions = {
  baby: ['new beginnings', 'tiny toes', 'joy', 'peace', 'family'],
  thinking: ['miss you', 'different cities', 'weekend walks', 'thank you', 'encouragement']
};
export function keywords(value = '') {
  const values = Array.isArray(value) ? value : value.split(/[,;\n]/);
  return [...new Set(values.map(word => String(word).trim()).filter(Boolean))].slice(0, 5).map(word => word.slice(0, 40));
}
function personalLine(input) {
  const words = keywords(input.keywords);
  if (!words.length) return '';
  const phrases = words.map(word => {
    const known = {
      'miss you': 'I miss you and wanted you to know you are in my thoughts.',
      'different cities': 'Even from different cities, I’m sending warmth your way.',
      'weekend walks': 'Thinking of weekend walks brings a little warmth to this note.',
      'thank you': 'Thank you for the warmth you bring into my life.',
      encouragement: 'May you find a little courage and a little rest today.',
      'new beginnings': 'Here’s to new beginnings, held gently and with hope.',
      'tiny toes': 'Wishing you sweet moments with those tiny toes.',
      joy: 'May there be joy in the little moments.',
      peace: 'May peace find its way into your days.',
      family: 'May your family be surrounded by care.'
    };
    return known[word.toLowerCase()] || `Sending this thought with love: “${word}”.`;
  });
  return phrases.join(' ');
}
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
    input = {faith:'Universal', tone:'Warm', ...input};
    if (!presets.includes(input.preset) || !faiths.includes(input.faith) || !tones.includes(input.tone)) throw new Error('Unsupported selection');
    const isBaby = input.preset === 'baby';
    return {
      title: isBaby ? 'A little life, a world of love' : 'A little light, sent to you',
      theme: isBaby ? 'dawn' : 'twilight',
      blessing: `${input.recipient ? `Dear ${input.recipient},\n\n` : ''}${(isBaby ? baby : thinking)[input.tone]}${faith[input.faith]}${personalLine(input) ? `\n\n${personalLine(input)}` : ''}${input.detail ? `\n\n${input.detail}` : ''}`,
      keepsake: isBaby ? 'Small beginnings. Boundless love.' : 'You are close to my heart, wherever you are.',
      sender: input.sender || '', script: ''
    };
  },
  async script(input, result, seconds = 15) {
    const greeting = `Hi${input.recipient ? ` ${input.recipient}` : ''}.`;
    const text = (personalLine(input) || result.blessing.replace(/^Dear [^\n]+,\n\n/, '')).split(/(?<=[.!?])\s+/);
    // Approximately 2 words/second. Whole sentences only; arbitrary keywords never invent memories.
    const budget = seconds === 30 ? 62 : 30;
    let script = greeting;
    for (const sentence of text) {
      if ((script+' '+sentence).split(/\s+/).length > budget) break;
      script += ' '+sentence;
    }
    if (script === greeting) script += ' I wanted to send a little love your way today.';
    if ((script+' '+result.keepsake).split(/\s+/).length <= budget) script += ' '+result.keepsake;
    return script;
  }
};
