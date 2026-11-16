// DRAFT: definitions that did not exist yet. Not connected to the site. For review before anything is added.
// Style rules applied: no "real/genuine/truly" intensifiers, no em dashes, no "tends to" hedging, each channel says something
// specific to its own two gates, and none repeats another channel's wording.

// 1. The 36 Human Design channels. Key is the two gate numbers, written the way the chart's CHANNELS list has them.
export const CHANNEL_DEFS = {
  "64-47": `Abstraction. Head to Ajna. Mental pressure that turns past experiences and old images into a story that makes sense. The mind replays what happened until the meaning drops into place, usually all at once. It sorts out the past on its own schedule, not on demand.`,
  "61-24": `Awareness. Head to Ajna. A steady pull to understand what cannot be seen or explained yet. The mind takes up one question and circles it, sometimes for years, until it clears. This is the thinker's channel: private, inward, and driven by inspiration instead of usefulness.`,
  "63-4": `Logic. Head to Ajna. A mind that tests what looks settled and builds formulas out of patterns. It doubts first, then produces a workable answer, then doubts the answer. The questioning is the tool, and what comes out of it is proof: what holds up and what does not.`,
  "17-62": `Acceptance. Ajna to Throat. Opinions built from observed patterns and spoken in exact detail. This channel puts information in a sequence others can follow and names the specifics that make an idea usable. Its weak point is expecting everyone to accept the logic as quickly as it does.`,
  "43-23": `Structuring. Ajna to Throat. A sudden individual insight, followed by the work of putting it into words. The knowing arrives first and the explanation comes later, and early on it can sound strange. Once it finds the right wording, the odd idea becomes one other people can use.`,
  "11-56": `Curiosity. Ajna to Throat. A search for ideas and experiences, turned into stories. This channel collects what it finds and passes it on so that it comes alive for the listener. It teaches through narrative, and it loses interest when the material stops being new.`,
  "16-48": `The Wavelength. Throat to Spleen. Skill that deepens with repetition. Enthusiasm starts the practice, and each round goes deeper, until the talent looks effortless. It does best on a subject chosen for long-term mastery, not for variety.`,
  "20-57": `The Brainwave. Throat to Spleen. Instant intuition spoken in the present moment. The body registers what is right or wrong now, and the voice reports it without delay. It is fast and quiet, and it loses accuracy when it stops to think the answer over.`,
  "20-34": `Charisma. Throat to Sacral. Power that shows up as action in the present moment. This channel is busy, responds to what is happening, and gets things done by doing them. It wears out when it stays busy for its own sake, so it needs work worth the effort.`,
  "32-54": `Transformation. Spleen to Root. Ambition with staying power. This channel sees what will last and drives toward it, often from a modest start, aiming to rise and bring others along. It pushes in whatever direction it is pointed, so the choice of direction matters.`,
  "28-38": `Struggle. Spleen to Root. Persistence in the face of difficulty. The struggle is how this channel finds what matters: it keeps fighting until a purpose proves worth it. It is stubborn on principle, and it burns out when the fight has no purpose it believes in.`,
  "18-58": `Judgment. Spleen to Root. A drive to correct what is flawed, and the energy to improve it. This channel spots the weak point in a system and wants to fix it, and the fixing is what keeps it going. The risk is turning the critical eye on people, who do not respond to correction the way a process does.`,
  "20-10": `Awakening. Throat to G. Acting from your own convictions in the present moment. What this person says and does matches who they are right now, with nothing performed. It is a channel of living the way you mean to, and it shows in how directly they behave.`,
  "31-7": `The Alpha. Throat to G. Leadership that others choose. This channel speaks in a way a group wants to follow and holds a role through its conduct, not through orders. It works when the group has invited it to lead and struggles when the lead is simply taken.`,
  "8-1": `Inspiration. Throat to G. Creative expression that becomes an example. This channel does things its own way, out loud, and what it makes shows others what is possible. It cannot be copied or made to order, and it works when allowed to be itself in public.`,
  "33-13": `The Prodigal. Throat to G. A cycle of withdrawing and returning. This channel goes away to take in experience, then comes back and tells what it learned, and people gather to hear it. It listens to stories, keeps them, and later turns them into counsel.`,
  "10-34": `Exploration. G to Sacral. Power used in the person's own way. This channel follows its own convictions, acts on them with strong energy, and does not wait for approval. It explores through action, and its drive goes flat when it is made to walk someone else's path.`,
  "15-5": `Rhythm. G to Sacral. A steady personal tempo that carries across extremes. This channel keeps its own routines of sleep, work and rest and moves smoothly inside them. Interruptions from other people's schedules throw it off for longer than they should.`,
  "2-14": `The Beat. G to Sacral. A sense of direction with the energy to follow it. This channel knows where to go and has the drive to produce the resources for getting there. Others notice the direction and follow it, so this person ends up steering for more than themselves.`,
  "46-29": `Discovery. G to Sacral. Success that comes from being fully present and committing. This channel says yes, shows up in the body, and stays through the long middle of the effort. Luck arrives here because the person was in the right place and did not leave.`,
  "10-57": `Perfected Form. G to Spleen. Intuition applied to how a person lives. This channel adjusts its habits and conduct by instinct, toward whatever keeps it healthy, safe and itself. It senses quickly what suits the body and what does not, and it arranges its life to match.`,
  "57-34": `Power. Spleen to Sacral. Instinct that moves at once. The intuition registers danger or opportunity and the body acts without waiting to be told. It is a survival channel, fast and physical, and it works best when it is trusted in the moment.`,
  "50-27": `Preservation. Spleen to Sacral. A caretaker of people and shared values. This channel provides for a family or community, sets the standards they live by, and reacts when those are broken. The care is practical: food, rules, safety. It wears down when it gives without rest.`,
  "45-21": `Money. Throat to Heart. Control of material resources. This channel gathers what a group needs, decides how it is shared out, and speaks for that leadership. It wants its own domain to run, and it treats money and property as a form of authority.`,
  "59-6": `Intimacy. Sacral to Solar Plexus. A drive to bond that works through emotional openness. This channel closes the distance between people so that closeness can happen, and the friction along the way is part of how trust gets built. It is also the channel of fertility and of starting a family.`,
  "42-53": `Maturation. Sacral to Root. A cycle that starts, grows and ends. This channel begins things with energy and carries them to completion over repeated rounds. Each cycle teaches something, and it is most at ease when one is allowed to finish before the next begins.`,
  "3-60": `Mutation. Sacral to Root. Energy that arrives in pulses and changes things. This channel works inside limits, and now and then produces a sudden shift that opens a new way of doing something. The timing cannot be forced, and quiet stretches come before the burst.`,
  "9-52": `Concentration. Sacral to Root. Focused attention on one thing at a time. This channel settles into a task with patience and the energy to finish the details. It needs stillness and few interruptions, and in that state it can work for long stretches and get things done.`,
  "26-44": `Surrender. Heart to Spleen. Persuasion drawn from past experience. This channel recognizes which patterns work and presents them in their best light, in selling, teaching or passing on traditions. It carries the memory of what a family or group has done before.`,
  "25-51": `Initiation. G to Heart. A leap into the new. This channel takes the first step, often after a jolt, and competes to be first. The shock wakes it up. It then offers the experience to others as a model of courage.`,
  "40-37": `Community. Heart to Solar Plexus. An exchange between giving and rest. This channel works for the people it cares about, expects a fair return, and builds the agreements that hold a family or community together. It needs time alone afterward to recover from providing.`,
  "35-36": `Transitoriness. Throat to Solar Plexus. A hunger for new experience, including the hard kinds. This channel pushes into unfamiliar emotional ground and can be thrown into crisis on the way. The result is wide experience and a voice that can speak about many kinds of life.`,
  "12-22": `Openness. Throat to Solar Plexus. Speech that depends on mood. This channel can say something moving and graceful, and it lands when the emotional timing is right. The same words in a low mood or at the wrong moment fall flat, so it does best when it waits for the right feeling to speak.`,
  "49-19": `Synthesis. Solar Plexus to Root. Sensitivity to what people need and to the principles a group lives by. This channel notices who is under-supported and cares how resources are shared. It will leave a bond or a group when its principles are broken.`,
  "55-39": `Emoting. Solar Plexus to Root. Mood as a creative force. This channel carries strong swings, high and low, that stir the people around it. The emotion produces a creative spark and pushes others to react honestly. Choices wait until the mood has passed.`,
  "30-41": `Recognition. Solar Plexus to Root. A desire for a new experience that pulls toward it. This channel starts with a quiet wish, builds it into a strong emotional pull, and then chases it. The longing sets a new cycle of life in motion and can run on for years.`
};

// 2. Essence 33. The other Essence entries use this three-sentence shape.
export const ESSENCE_33 = `Living through a 33 Essence cycle, this chapter is oriented around caring for others on a wide scale. You are likely feeling a pull to teach, heal or serve beyond your own circle, with the weight of responsibility that goes with it. It is a chapter for giving, and for learning to give without emptying yourself.`;

// 3. Meanings for the astrology events on the timeline. Key: planet.aspect.target, where target is Sun, Moon, Ascendant or Own
// (the planet's own birth position). Ages are left out on purpose: the timeline already shows the dates.
export const TIMELINE_EVENT_DEFS = {
  "saturn.Conjunction.Sun": `Restriction and responsibility around who you are. Your identity gets measured by what you can carry and finish, and what no longer holds weight drops away.`,
  "saturn.Square.Sun": `Pressure against your sense of self. Obstacles and delays make recognition harder to earn, and you decide what you are willing to build.`,
  "saturn.Opposition.Sun": `Other people hold up a mirror to your identity. Duties to others clash with what you want for yourself, and a choice gets made.`,
  "saturn.Conjunction.Moon": `A heavy, serious stretch emotionally. Feelings are held back and put under control, and home and family matters weigh more than usual.`,
  "saturn.Square.Moon": `Emotional strain and unmet needs. Duty competes with comfort, and you are asked to look after yourself without waiting for others to.`,
  "saturn.Opposition.Moon": `Responsibility toward other people runs against your own emotional needs. A relationship or home arrangement is tested for what it can hold.`,
  "saturn.Conjunction.Ascendant": `A more serious way of presenting yourself. People start to see you as responsible, and your public image is rebuilt around maturity.`,
  "saturn.Square.Ascendant": `Pressure on how you come across. Obstacles show up in dealings with other people, and your approach has to become more disciplined.`,
  "saturn.Opposition.Ascendant": `Others hold up a mirror. Relationships ask for more commitment, and what you avoided showing gets reflected back at you.`,
  "saturn.Return": `Saturn comes back to where it was at birth, about every 29 years. The structures you built are reviewed: what has held up stays, and what has not is dropped.`,
  "saturn.Square.Own": `A mid-cycle test of your long-term structure. The work, routines and commitments you set up are checked for strain, and the weak parts get rebuilt.`,
  "saturn.Opposition.Own": `The halfway point of Saturn's cycle. Your plans are measured against what they have met so far, and you adjust direction before the next stretch.`,

  "uranus.Conjunction.Sun": `A break with your old identity. Sudden changes and a need for freedom push you to live as yourself and drop the roles that confine you.`,
  "uranus.Square.Sun": `Restlessness and disruption in how you live. Events interrupt your routines, and you are pushed to change course or assert your independence.`,
  "uranus.Opposition.Sun": `Other people or outside events shake your identity. A relationship or situation demands change, and your need for freedom collides with what you have committed to.`,
  "uranus.Conjunction.Moon": `Sudden change at home and in your feelings. Restlessness, and a push to break old emotional habits.`,
  "uranus.Square.Moon": `Emotional unrest and disrupted routines. Home life changes without warning, and old comfort patterns stop working.`,
  "uranus.Opposition.Moon": `Unsettled feelings about home and closeness. Others pull away or push for change, and you loosen your hold on what felt secure.`,
  "uranus.Conjunction.Ascendant": `A sudden change of image. You show up differently, and may change your appearance, direction or the way you meet people.`,
  "uranus.Square.Ascendant": `Disruption in how you present yourself. Unexpected events change your plans and how others see you, and you act more independently.`,
  "uranus.Opposition.Ascendant": `Others bring sudden change. Relationships and partnerships shift without warning, and you are pushed to be more independent inside them.`,
  "uranus.Square.Own": `A restless push for change in your adult life. The freedoms you have claimed are tested, and you reconsider what you have settled for.`,
  "uranus.Opposition.Own": `The midlife shake-up. The life you built is questioned, and the urge to change whatever no longer fits grows strong.`,

  "neptune.Conjunction.Sun": `Your sense of self blurs. Dreams, idealism and doubt grow stronger, and it is harder to see where you stand until you find what you believe in.`,
  "neptune.Square.Sun": `Confusion about direction and energy. Plans lose focus, and you are drawn toward ideals or escapes that do not hold up.`,
  "neptune.Opposition.Sun": `Other people appear in an ideal or confusing light. Promises and trust need extra care, because what is presented may not be what it seems.`,
  "neptune.Conjunction.Moon": `Heightened sensitivity. Moods are harder to read, intuition grows, and you absorb the feelings of those around you.`,
  "neptune.Square.Moon": `Emotional fog and a pull toward escape. Your needs go unclear, and you may give more than you can carry.`,
  "neptune.Opposition.Moon": `Other people's needs blur your own. Closeness brings idealizing and disappointment, so boundaries need to be clear.`,
  "neptune.Conjunction.Ascendant": `A softening of how you appear. You are more impressionable, others see in you what they want to see, and you present yourself less sharply.`,
  "neptune.Square.Ascendant": `Your image blurs. You may feel misunderstood or lose track of your direction, and you need firm footing.`,
  "neptune.Opposition.Ascendant": `Others pull on you in confusing ways: idealized relationships, or dealings where the facts are unclear.`,
  "neptune.Square.Own": `A stretch of questioning the ideals your life was built around. Faith, vision and dreams are checked against what has happened, and the disillusion clears space for a truer picture.`,

  "pluto.Conjunction.Sun": `A deep turning point in identity. An old version of you ends, and a stronger one forms through loss, pressure and the removal of what no longer works.`,
  "pluto.Square.Sun": `Pressure and power struggles force change. Something you hold onto is stripped away, and you come out surer of what you value.`,
  "pluto.Opposition.Sun": `Others bring intense pressure. A relationship or an authority challenges you, and the struggle shows what you will and will not give up.`,
  "pluto.Conjunction.Moon": `Emotions run deep. Old feelings come up to be dealt with, and home and family circumstances change at the root.`,
  "pluto.Square.Moon": `Intense emotional pressure. Hidden feelings, control issues or family matters surface, and you have to face them to move on.`,
  "pluto.Opposition.Moon": `Others stir your deepest emotions. Closeness brings control, jealousy or letting go, and an emotional bond is rebuilt or ended.`,
  "pluto.Conjunction.Ascendant": `A transformation of how you appear. You change your image, and others meet a stronger, more intense version of you.`,
  "pluto.Square.Ascendant": `Pressure on your public self. Power struggles shape how you present and deal with people, and you shed an old image.`,
  "pluto.Opposition.Ascendant": `Intense change arrives through other people. A powerful person or relationship makes you look at control and redefine yourself.`,
  "pluto.Square.Own": `A deep re-examination of power and control in your life. Long-held patterns are challenged at their root.`,

  "jupiter.Return": `Jupiter comes back to where it was at birth, about every 12 years. A new cycle of growth begins: optimism rises, and a chance appears to expand your work, learning or beliefs.`,
  "nn.Return": `The Nodes come back to their birth position about every 19 years. Direction resets: questions about purpose and what you are growing toward come up again, and old habits are weighed against where you are heading.`
};
