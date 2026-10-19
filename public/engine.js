export const faiths = ['Universal', 'Christian', 'Catholic', 'Islamic'];
export const tones = ['Warm', 'Elegant', 'Playful', 'Poetic', 'Minimal'];
export const presets = ['baby', 'thinking', 'wishes'];
export const suggestions = {
  baby: ['new beginnings', 'tiny toes', 'joy', 'peace', 'family'],
  thinking: ['miss you', 'different cities', 'weekend walks', 'thank you', 'encouragement'],
  wishes: ['happiness', 'good health', 'new chapter', 'good luck', 'celebration']
};
export function keywords(value = '') {
  const values = Array.isArray(value) ? value : value.split(/[,;\n]/);
  return [...new Set(values.map(word => String(word).trim()).filter(Boolean))].slice(0, 5).map(word => word.slice(0, 40));
}
export function scriptQuote(script) {
  const spoken=script.replace(/^Hi[^.!?]*[.!?]\s*/,'');
  const sentence=spoken.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0].trim();
  return sentence && sentence.length<=138 ? `“${sentence}”` : '';
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
      family: 'May your family be surrounded by care.',
      happiness: 'May happiness find you in both the everyday and the unexpected.',
      'good health': 'Wishing you good health and days that feel gentle.',
      'new chapter': 'May this new chapter bring possibilities that feel right for you.',
      'good luck': 'Wishing you good luck with whatever comes next.',
      celebration: 'Here’s to a moment worth celebrating, and the people who make it special.'
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
const wishes = {
  Warm: 'Sending you heartfelt wishes for the days ahead. May you find reasons to smile, people to lean on, and moments that feel truly yours.',
  Elegant: 'With warmest wishes for a bright path ahead, filled with meaningful moments and the quiet reassurance of being cared for.',
  Playful: 'A little pocketful of good wishes, just for you. Here’s to happy surprises, small wins, and plenty of reasons to celebrate.',
  Poetic: 'May the days ahead open like windows to the light, bringing small wonders and room for your hopes to grow.',
  Minimal: 'Wishing you joy, peace, and good things ahead.'
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
      title: isBaby ? 'A little life, a world of love' : input.preset === 'wishes' ? 'Good things, wished for you' : 'A little light, sent to you',
      theme: isBaby ? 'spring' : input.preset === 'wishes' ? 'summer' : 'winter',
      blessing: `${input.recipient ? `Dear ${input.recipient},\n\n` : ''}${({baby,thinking,wishes})[input.preset][input.tone]}${faith[input.faith]}${personalLine(input) ? `\n\n${personalLine(input)}` : ''}${input.detail ? `\n\n${input.detail}` : ''}`,
      keepsake: isBaby ? 'Small beginnings. Boundless love.' : input.preset === 'wishes' ? 'A little wish. A world of possibility.' : 'You are close to my heart, wherever you are.',
      sender: input.sender || '', script: ''
    };
  },
  async script(input, result, seconds = 15) {
    const greeting = `Hi${input.recipient ? ` ${input.recipient}` : ''}.`;
    const chosen = keywords(input.keywords).map(word=>word.toLowerCase());
    const baby = input.preset === 'baby';
    const thanks = chosen.includes('thank you');
    const text = baby ? [
      "I'm so happy for you and your growing family.",
      "I hope you find little moments to enjoy together as this new chapter begins.",
      chosen.includes('peace') ? "And when things feel busy, I hope you get some rest and plenty of support." : "You don't have to have everything figured out; I'm cheering you on.",
      "Sending you and your little one so much love."
    ] : input.preset === 'wishes' ? [
      "I wanted to send you a little good wish today.",
      "I hope the days ahead bring you something to smile about.",
      chosen.includes('new chapter') ? "As this new chapter begins, I'm cheering you on." : chosen.includes('good health') ? "I hope you're finding time to rest and look after yourself." : "Whatever comes next, I hope you feel supported and cared for.",
      "Sending you lots of warmth and my very best wishes."
    ] : [
      thanks ? "I just wanted to say how much I appreciate you." : chosen.includes('miss you') ? "I miss you, and I wanted to send a little love your way." : "You've been on my mind, so I wanted to say hello.",
      chosen.includes('different cities') ? "Even from another city, I'm thinking of you." : "I hope this brings a little warmth to your day.",
      chosen.includes('weekend walks') ? "The thought of a weekend walk together makes me smile." : chosen.includes('encouragement') ? "I hope you can be gentle with yourself today; I'm cheering you on." : "I hope we get a chance to catch up soon."
    ];
    // Whole, conversational sentences; never turn arbitrary keywords into invented memories.
    const budget = seconds === 30 ? 62 : 30;
    let script = greeting;
    for (const sentence of text) {
      if ((script+' '+sentence).split(/\s+/).length > budget) break;
      script += ' '+sentence;
    }
    if (script === greeting) script += ' Sending a little love your way.';
    return script;
  }
};
