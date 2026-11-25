/* GridSmith — data banks: topics, word banks, vocabulary, passages.
   Pure data, no logic. Loaded by index.html and by the Node self-check. */
(function (global) {
  "use strict";

  /* ---------------- Topic catalogue ---------------- */
  // band: A = grades 1-2, B = grades 3-4, C = grades 5-6
  var TOPICS = {
    math: {
      A: [
        { id: "addsub",   label: "Addition & Subtraction", desc: "Number sentences within 20 / 100, with regrouping practice" },
        { id: "counting", label: "Counting Objects",       desc: "Count groups of objects, including tens and ones" },
        { id: "word",     label: "Word Problems",          desc: "Short joining, taking away and comparing stories" },
        { id: "sequence", label: "Number Sequences",       desc: "Find the missing numbers in counting patterns" }
      ],
      B: [
        { id: "multdiv",        label: "Multiplication & Division", desc: "Times-table facts, 2-digit × 1-digit, division" },
        { id: "fractionsBasic", label: "Fractions — Basics",        desc: "Name, compare and find fractions of a set" },
        { id: "measurement",    label: "Measurement",               desc: "Length, mass, volume and time conversions & problems" },
        { id: "money",          label: "Money",                     desc: "Totals, change and coin problems in dollars" }
      ],
      C: [
        { id: "fractionsOps",    label: "Fraction Operations",   desc: "Add, subtract, multiply and divide fractions" },
        { id: "decimalsPercent", label: "Decimals & Percent",    desc: "Decimal arithmetic and percent of a number" },
        { id: "ratio",           label: "Ratio",                 desc: "Part-to-part and part-to-whole ratio problems" },
        { id: "geometry",        label: "Area & Perimeter",      desc: "Rectangles, squares and triangles" },
        { id: "multistep",       label: "Multi-Step Problems",   desc: "Word problems that need two or three steps" }
      ]
    },
    english: {
      A: [
        { id: "vocab",   label: "Vocabulary",        desc: "Pick the word that fits the sentence" },
        { id: "grammar", label: "Grammar Basics",    desc: "is / are, a / an, has / have" },
        { id: "reading", label: "Reading",           desc: "A short story with comprehension questions", minGrade: 2 }
      ],
      B: [
        { id: "vocab",   label: "Vocabulary",         desc: "Pick the word that fits the sentence" },
        { id: "choose",  label: "Choose the Word",    desc: "their / there, to / too, your / you're and friends" },
        { id: "grammar", label: "Grammar",            desc: "Past tense, was / were, pronouns" },
        { id: "reading", label: "Reading",            desc: "A short passage with comprehension questions" }
      ],
      C: [
        { id: "vocab",   label: "Vocabulary",         desc: "Richer words in context" },
        { id: "choose",  label: "Choose the Word",    desc: "than / then, loose / lose, quiet / quite and friends" },
        { id: "grammar", label: "Grammar",            desc: "Subject–verb agreement, past tense, comparatives" },
        { id: "reading", label: "Reading",            desc: "A longer passage with comprehension questions" }
      ]
    }
  };

  function bandOf(grade) { return grade <= 2 ? "A" : grade <= 4 ? "B" : "C"; }

  /* ---------------- Shared word banks ---------------- */
  var NAMES = ["Maya", "Liam", "Sofia", "Noah", "Ava", "Ethan", "Mia", "Lucas",
    "Amara", "Leo", "Nina", "Omar", "Rani", "Dimas", "Sari", "Bima", "Lila",
    "Hana", "Kenji", "Tara", "Elias", "Putri", "Jonas", "Freya"];

  // [singular, plural]
  var ITEMS = [
    ["marble", "marbles"], ["sticker", "stickers"], ["pencil", "pencils"],
    ["apple", "apples"], ["orange", "oranges"], ["book", "books"],
    ["shell", "shells"], ["coin", "coins"], ["card", "cards"],
    ["balloon", "balloons"], ["cupcake", "cupcakes"], ["flower", "flowers"],
    ["button", "buttons"], ["crayon", "crayons"], ["stone", "stones"],
    ["cookie", "cookies"], ["stamp", "stamps"], ["bead", "beads"]
  ];

  var PLACES = ["the park", "the school fair", "the library", "the market", "the garden", "the beach"];

  /* ---------------- Vocabulary banks (by band) ---------------- */
  // Each entry: word, short definition, sentence with ___ blank, category.
  // Distractors are drawn from OTHER categories so they cannot fit the sentence.
  var VOCAB = {
    A: [
      { w: "apple",   cat: "food",    def: "a round fruit that grows on a tree",        s: "She bit into the crunchy red ___ and smiled." },
      { w: "banana",  cat: "food",    def: "a long yellow fruit",                       s: "The monkey peeled the ___ before eating it." },
      { w: "bread",   cat: "food",    def: "a baked food made from flour",              s: "Dad sliced the fresh ___ for our sandwiches." },
      { w: "puppy",   cat: "animal",  def: "a baby dog",                                s: "The little ___ wagged its tail and barked happily." },
      { w: "kitten",  cat: "animal",  def: "a baby cat",                                s: "The ___ purred softly while it slept in the basket." },
      { w: "rabbit",  cat: "animal",  def: "a small animal with long ears that hops",   s: "The ___ hopped across the grass to its hole." },
      { w: "sunny",   cat: "weather", def: "bright with lots of sunshine",              s: "It was a warm, ___ day, so we played outside." },
      { w: "rainy",   cat: "weather", def: "wet because rain is falling",               s: "On a ___ day, we wear boots and carry an umbrella." },
      { w: "happy",   cat: "feeling", def: "feeling glad and cheerful",                 s: "She felt ___ when she saw her birthday cake." },
      { w: "sleepy",  cat: "feeling", def: "tired and ready for bed",                   s: "After the long trip, the baby was ___ and yawned." },
      { w: "school",  cat: "place",   def: "a place where children learn",              s: "Every morning, the children walk to ___ together." },
      { w: "garden",  cat: "place",   def: "a place where flowers and vegetables grow", s: "Grandma grows tomatoes in her ___." },
      { w: "bicycle", cat: "thing",   def: "a vehicle with two wheels that you pedal",  s: "He rode his ___ to the park." },
      { w: "blanket", cat: "thing",   def: "a soft cover that keeps you warm in bed",   s: "She pulled the warm ___ over her feet." }
    ],
    B: [
      { w: "enormous",  cat: "size",    def: "very, very big",                            s: "The elephant is an ___ animal with huge ears." },
      { w: "tiny",      cat: "size",    def: "very, very small",                          s: "A ___ ant crawled across the leaf." },
      { w: "whisper",   cat: "sound",   def: "to speak very softly",                      s: "Please ___ in the library so you do not disturb others." },
      { w: "shout",     cat: "sound",   def: "to call out loudly",                        s: "Do not ___ in class; raise your hand instead." },
      { w: "brave",     cat: "quality", def: "not afraid, even when something is scary",  s: "The ___ firefighter ran into the smoky building." },
      { w: "honest",    cat: "quality", def: "always telling the truth",                  s: "An ___ person admits a mistake instead of hiding it." },
      { w: "journey",   cat: "travel",  def: "a long trip from one place to another",     s: "Their ___ across the mountains took three days." },
      { w: "arrive",    cat: "travel",  def: "to reach a place",                          s: "The train will ___ at the station at noon." },
      { w: "delicious", cat: "taste",   def: "tasting very good",                         s: "The soup was so ___ that everyone asked for more." },
      { w: "bitter",    cat: "taste",   def: "having a sharp, unpleasant taste",          s: "The medicine tasted ___ , so he drank water quickly." },
      { w: "collect",   cat: "action",  def: "to gather things together",                 s: "She likes to ___ shiny shells at the beach." },
      { w: "repair",    cat: "action",  def: "to fix something that is broken",           s: "Dad will ___ the flat tire on my bike." },
      { w: "ancient",   cat: "time",    def: "very, very old",                            s: "The museum has an ___ pot from a thousand years ago." },
      { w: "modern",    cat: "time",    def: "new and from the present time",             s: "The ___ building has glass walls and fast lifts." }
    ],
    C: [
      { w: "reluctant",  cat: "feeling", def: "not wanting to do something",                s: "He was ___ to speak in front of the class, but he did it anyway." },
      { w: "generous",   cat: "quality", def: "happy to share with others",                 s: "The ___ baker gave free bread to every child in line." },
      { w: "curious",    cat: "quality", def: "wanting to learn and ask questions",         s: "The ___ student asked why the moon changes shape." },
      { w: "fragile",    cat: "thing",   def: "easy to break",                              s: "Carry the ___ vase with both hands so it does not fall." },
      { w: "sturdy",     cat: "thing",   def: "strong and not easy to break",               s: "The bridge was ___ enough for trucks to cross." },
      { w: "vanish",     cat: "action",  def: "to disappear suddenly",                      s: "The rabbit seemed to ___ behind the bush." },
      { w: "observe",    cat: "action",  def: "to watch carefully",                         s: "Scientists ___ the stars through a telescope." },
      { w: "essential",  cat: "idea",    def: "needed and very important",                  s: "Water is ___ for all living things." },
      { w: "artificial", cat: "idea",    def: "made by people, not natural",                s: "The lake is ___ ; workers dug it fifty years ago." },
      { w: "gradually",  cat: "time",    def: "slowly, little by little",                   s: "The sky ___ turned orange as the sun went down." },
      { w: "frequent",   cat: "time",    def: "happening often",                            s: "___ rain made the river rise this month." },
      { w: "victory",    cat: "event",   def: "winning a game or contest",                  s: "The team cheered loudly after their ___ in the final match." },
      { w: "defeat",     cat: "event",   def: "losing a game or contest",                   s: "After the ___ , the players shook hands and promised to practice more." },
      { w: "enormous",   cat: "size",    def: "extremely large",                            s: "An ___ wave crashed over the rocks during the storm." }
    ]
  };

  /* ---------------- "Choose the correct word" banks ---------------- */
  var CHOOSE = {
    B: [
      { s: "Please put the books over ___ on the table.", options: ["their", "there", "they're"], answer: "there",  why: "\"There\" points to a place. \"Their\" shows ownership, and \"they're\" means \"they are\"." },
      { s: "The twins forgot ___ umbrellas at school.", options: ["their", "there", "they're"], answer: "their",  why: "\"Their\" shows that the umbrellas belong to the twins." },
      { s: "___ going to the zoo tomorrow.", options: ["Their", "There", "They're"], answer: "They're", why: "\"They're\" is short for \"they are\", which fits the sentence." },
      { s: "I have ___ pencils in my bag.", options: ["to", "too", "two"], answer: "two",   why: "\"Two\" is the number 2." },
      { s: "She wants to come ___ .", options: ["to", "too", "two"], answer: "too",   why: "\"Too\" means \"also\" here." },
      { s: "Is this ___ notebook or mine?", options: ["your", "you're"], answer: "your",  why: "\"Your\" shows that the notebook belongs to you." },
      { s: "___ doing great work today!", options: ["Your", "You're"], answer: "You're", why: "\"You're\" is short for \"you are\"." },
      { s: "The dog wagged ___ tail happily.", options: ["its", "it's"], answer: "its",   why: "\"Its\" shows belonging. \"It's\" means \"it is\"." },
      { s: "___ raining, so practice is cancelled.", options: ["Its", "It's"], answer: "It's",  why: "\"It's\" is short for \"it is\"." },
      { s: "___ is my classroom, Room 12.", options: ["This", "These"], answer: "This", why: "\"This\" is used for one thing that is near. \"These\" is for more than one." },
      { s: "___ are my new shoes.", options: ["This", "These"], answer: "These", why: "\"These\" is used for more than one thing. Shoes are plural." },
      { s: "Can you ___ the bell ringing?", options: ["hear", "here"], answer: "hear",  why: "\"Hear\" is about listening. \"Here\" is a place." }
    ],
    C: [
      { s: "Riding a bike is easier ___ walking up the steep hill.", options: ["than", "then"], answer: "than", why: "\"Than\" is used to compare two things." },
      { s: "We had lunch, and ___ we played outside.", options: ["than", "then"], answer: "then", why: "\"Then\" tells what happened next." },
      { s: "Tie your shoes tightly so they do not come ___ .", options: ["lose", "loose"], answer: "loose", why: "\"Loose\" means not tight. \"Lose\" means to misplace something." },
      { s: "Try not to ___ your library card.", options: ["lose", "loose"], answer: "lose", why: "\"Lose\" means to misplace something." },
      { s: "Please be ___ in the library.", options: ["quiet", "quite"], answer: "quiet", why: "\"Quiet\" means making little noise. \"Quite\" means \"very\"." },
      { s: "The hike was ___ tiring, but the view was worth it.", options: ["quiet", "quite"], answer: "quite", why: "\"Quite\" means \"very\" here." },
      { s: "The loud music may ___ your hearing over time.", options: ["affect", "effect"], answer: "affect", why: "\"Affect\" is a verb: it means to change or influence something." },
      { s: "The medicine had a quick ___ on his headache.", options: ["affect", "effect"], answer: "effect", why: "\"Effect\" is a noun: it means a result." },
      { s: "My teacher gave me good ___ about my essay.", options: ["advice", "advise"], answer: "advice", why: "\"Advice\" is a noun (a suggestion). \"Advise\" is a verb." },
      { s: "For ___ , we are having ice cream after dinner.", options: ["desert", "dessert"], answer: "dessert", why: "\"Dessert\" (with double s) is the sweet food. A \"desert\" is dry, sandy land." },
      { s: "Everyone came to the party ___ Ben, who was sick.", options: ["accept", "except"], answer: "except", why: "\"Except\" means \"but not\" or \"excluding\"." },
      { s: "Please ___ my apology for being late.", options: ["accept", "except"], answer: "accept", why: "\"Accept\" means to receive or agree to something." }
    ]
  };

  /* ---------------- Grammar banks ---------------- */
  // verb: [base, past]
  var VERBS = [
    ["play", "played"], ["watch", "watched"], ["cook", "cooked"], ["jump", "jumped"],
    ["help", "helped"], ["clean", "cleaned"], ["paint", "painted"], ["visit", "visited"],
    ["go", "went"], ["eat", "ate"], ["see", "saw"], ["run", "ran"], ["buy", "bought"],
    ["take", "took"], ["write", "wrote"], ["come", "came"], ["give", "gave"],
    ["swim", "swam"], ["sing", "sang"], ["drink", "drank"], ["fly", "flew"], ["read", "read"]
  ];
  var PAST_SCENES = [
    "Yesterday, {name} ___ a picture for the art show.",
    "Last night, {name} ___ a letter to a friend.",
    "Yesterday, {name} ___ to the market with Grandma.",
    "Last Saturday, {name} ___ in the school play.",
    "Yesterday afternoon, {name} ___ a cake for the family.",
    "Last week, {name} ___ a new book from the library."
  ];
  // scenes tied to specific verbs by index pairs: we pick scene + matching verb below in engine via VERB_SCENES
  var VERB_SCENES = [
    { v: ["paint", "painted"], s: "Yesterday, {name} ___ a picture for the art show." },
    { v: ["write", "wrote"],   s: "Last night, {name} ___ a letter to a friend." },
    { v: ["go", "went"],       s: "Yesterday, {name} ___ to the market with Grandma." },
    { v: ["sing", "sang"],     s: "Last Saturday, {name} ___ in the school play." },
    { v: ["cook", "cooked"],   s: "Yesterday afternoon, {name} ___ a cake for the family." },
    { v: ["build", "built"],   s: "Last weekend, {name} ___ a small boat from wood." },
    { v: ["swim", "swam"],     s: "Yesterday, {name} ___ in the lake for an hour." },
    { v: ["buy", "bought"],    s: "Last Monday, {name} ___ a gift for Mother." },
    { v: ["play", "played"],   s: "Yesterday, {name} ___ soccer with friends after school." },
    { v: ["eat", "ate"],       s: "This morning, {name} ___ two pancakes for breakfast." },
    { v: ["take", "took"],     s: "Yesterday, {name} ___ the bus to the museum." },
    { v: ["see", "saw"],       s: "Last night, {name} ___ a shooting star." }
  ];

  /* ---------------- Reading passages (original, curated) ---------------- */
  var PASSAGES = [
    {
      id: "milo", title: "Milo the Library Cat", level: 1, minGrade: 2, maxGrade: 4,
      text: "Milo is an orange cat who lives at the Sunnyvale Library. Every morning, he waits by the door until Mrs. Chen, the librarian, lets him in. Milo has a favorite blue cushion near the picture books. When children come to read, Milo sits beside them and listens. His soft purring helps shy readers feel brave. One rainy afternoon, a boy named Sam read a whole book aloud for the first time. Milo purred louder and louder. Mrs. Chen smiled and said, \"Good listeners make good readers.\" Sam grinned and picked up another book.",
      qs: [
        { q: "Where does Milo live?", options: ["At a school", "At the Sunnyvale Library", "At the beach"], answer: 1, why: "The first sentence says Milo lives at the Sunnyvale Library." },
        { q: "What does Milo do when children read?", options: ["He hides under a desk", "He runs outside", "He sits beside them and listens"], answer: 2, why: "The passage says Milo sits beside the children and listens while they read." },
        { q: "Why did Sam pick up another book?", options: ["Reading with Milo made him feel brave and happy", "Mrs. Chen told him he must", "The first book was too short"], answer: 0, why: "Milo's listening helped the shy reader feel brave, so Sam wanted to keep reading." }
      ]
    },
    {
      id: "raingarden", title: "The Rain Garden", level: 2, minGrade: 3, maxGrade: 5,
      text: "Behind Greenfield School there was a muddy corner where rainwater always made a big puddle. Last spring, Class 4B decided to fix it by building a rain garden. First, they dug a shallow bowl in the ground. Then they filled the bottom with sand and small stones so water could sink in slowly. On top, they planted grasses and flowers with deep roots. Now, when it rains, the puddle flows into the garden instead of the playground. Butterflies and bees visit the flowers, and frogs have even moved in. The muddy corner has become the school's favorite outdoor classroom.",
      qs: [
        { q: "Why did Class 4B build a rain garden?", options: ["To grow vegetables for lunch", "To fix a muddy corner where rainwater puddled", "To make a new playground"], answer: 1, why: "The class wanted to fix the corner where rainwater always made a big puddle." },
        { q: "What did the students put at the bottom of the garden?", options: ["Old leaves and grass", "Concrete and tiles", "Sand and small stones"], answer: 2, why: "They filled the bottom with sand and small stones so water could sink in slowly." },
        { q: "What happened after the rain garden was built?", options: ["The puddle got bigger", "Wildlife such as butterflies, bees and frogs came", "The corner was closed to students"], answer: 1, why: "The passage says butterflies and bees visit, frogs moved in, and it became a favorite outdoor classroom." }
      ]
    },
    {
      id: "lighthouse", title: "A Letter from the Lighthouse", level: 2, minGrade: 4, maxGrade: 6,
      text: "Every summer, Wren visited her grandfather, who had once been the keeper of the Gull Rock lighthouse. On her last visit, Grandfather gave her a small wooden box. Inside was a letter he had written forty years earlier, on his final night as keeper. \"Dear future keeper,\" it said, \"the light is not really for the ships. It is for the people on shore, so they know someone is watching over them.\" Wren asked why he never sent the letter. Grandfather laughed. \"Some letters are not for sending,\" he said. \"They are for remembering.\" That evening, Wren placed the letter back in its box, understanding that some treasures are kept, not given away.",
      qs: [
        { q: "Who had Grandfather been in the past?", options: ["A ship captain", "The keeper of the Gull Rock lighthouse", "A letter writer for the town"], answer: 1, why: "The passage says Grandfather had once been the keeper of the Gull Rock lighthouse." },
        { q: "According to the letter, who is the lighthouse light really for?", options: ["The people on shore", "The ships at sea", "The keeper himself"], answer: 0, why: "The letter says the light is for the people on shore, so they know someone is watching over them." },
        { q: "Why did Grandfather never send the letter?", options: ["He forgot where he put it", "He believed some letters are for remembering, not sending", "He did not know the address"], answer: 1, why: "Grandfather says, \"Some letters are not for sending. They are for remembering.\"" }
      ]
    },
    {
      id: "recycling", title: "The Recycling Team", level: 3, minGrade: 5, maxGrade: 6,
      text: "When the students of Harborview School weighed their trash in September, they were shocked: the school threw away 96 kilograms of waste every week, and almost half of it was paper. The newly formed Recycling Team set a goal to cut the school's waste in half by June. They placed labeled bins in every classroom, made posters showing what could be recycled, and weighed the trash every Friday. Progress was slow at first, but by March the weekly total had fallen to 61 kilograms. In June, the scale read 44 kilograms. The team had beaten their goal. Their advice to other schools is simple: measure first, because you cannot fix what you do not count.",
      qs: [
        { q: "How much waste did the school throw away each week in September?", options: ["44 kilograms", "61 kilograms", "96 kilograms"], answer: 2, why: "The first sentence says the school threw away 96 kilograms of waste every week." },
        { q: "What was the Recycling Team's goal?", options: ["To cut the school's waste in half by June", "To collect the most paper in the city", "To stop using bins"], answer: 0, why: "The team set a goal to cut the school's waste in half by June." },
        { q: "Did the team reach their goal? How do you know?", options: ["No — waste rose to 61 kilograms", "Yes — by June the weekly total was 44 kilograms, less than half of 96", "No — they stopped weighing the trash"], answer: 1, why: "Half of 96 kilograms is 48, and by June the scale read 44 kilograms, so they beat their goal." }
      ]
    },
    {
      id: "bees", title: "How Bees Talk", level: 3, minGrade: 5, maxGrade: 6,
      text: "Honeybees cannot speak, yet a bee that has found good flowers can tell the whole hive exactly where they are. When she returns, she performs a special dance on the honeycomb. If the flowers are close, she dances in a simple circle. If they are far away, she dances in a figure-eight pattern called a waggle dance. The angle of her dance shows the direction of the flowers compared with the sun, and the length of the waggle shows the distance. Other bees watch closely, then fly straight to the flowers. In this way, one bee's discovery becomes food for thousands.",
      qs: [
        { q: "What does a bee do when she returns after finding good flowers?", options: ["She makes extra honey", "She performs a special dance", "She leaves the hive alone"], answer: 1, why: "The passage says she performs a special dance on the honeycomb." },
        { q: "What does the length of the waggle show?", options: ["The color of the flowers", "How many bees should go", "The distance to the flowers"], answer: 2, why: "The passage says the length of the waggle shows the distance." },
        { q: "What dance does a bee use when the flowers are close?", options: ["A simple circle", "A figure-eight", "No dance at all"], answer: 0, why: "If the flowers are close, she dances in a simple circle." }
      ]
    },
    {
      id: "kite", title: "The Kite Festival", level: 1, minGrade: 2, maxGrade: 4,
      text: "Every October, the town of Windmere holds a kite festival on the big hill. This year, twins Ana and Ari built a kite shaped like a red dragon. On the morning of the festival, the wind was too strong, and their dragon spun in wild circles. Ari wanted to give up, but Ana had an idea. She tied a longer tail to the kite to help it balance. On the second try, the dragon rose smoothly into the blue sky. It did not win first prize, but the twins agreed it was the happiest kite on the hill.",
      qs: [
        { q: "What shape was the twins' kite?", options: ["A red dragon", "A blue bird", "A yellow fish"], answer: 0, why: "Ana and Ari built a kite shaped like a red dragon." },
        { q: "What problem did the twins have at first?", options: ["Their kite had no string", "The wind was too strong and the kite spun in circles", "It started to rain"], answer: 1, why: "The wind was too strong, and the dragon spun in wild circles." },
        { q: "How did Ana fix the problem?", options: ["She waited for a calmer day", "She bought a new kite", "She tied a longer tail to the kite"], answer: 2, why: "Ana tied a longer tail to the kite to help it balance." }
      ]
    }
  ];

  /* ---------------- Kisi-kisi (curriculum grid) keyword map ---------------- */
  // keyword (EN + ID) -> topic ids, resolved per band in the engine.
  var GRID_KEYWORDS = [
    { keys: ["fraction", "pecahan"], topics: { A: [], B: ["fractionsBasic"], C: ["fractionsOps"] } },
    { keys: ["multiplication", "perkalian", "times table", "tabel perkalian"], topics: { A: [], B: ["multdiv"], C: ["multistep"] } },
    { keys: ["division", "pembagian"], topics: { A: [], B: ["multdiv"], C: ["multistep"] } },
    { keys: ["addition", "penjumlahan", "adding"], topics: { A: ["addsub"], B: ["addsub"], C: ["decimalsPercent"] } },
    { keys: ["subtraction", "pengurangan", "subtracting"], topics: { A: ["addsub"], B: ["addsub"], C: ["decimalsPercent"] } },
    { keys: ["counting", "membilang", "count"], topics: { A: ["counting"], B: [], C: [] } },
    { keys: ["sequence", "urutan", "pola bilangan", "pattern"], topics: { A: ["sequence"], B: [], C: [] } },
    { keys: ["word problem", "soal cerita", "story problem"], topics: { A: ["word"], B: ["money", "measurement"], C: ["multistep"] } },
    { keys: ["money", "uang"], topics: { A: ["word"], B: ["money"], C: ["multistep"] } },
    { keys: ["measurement", "pengukuran", "satuan", "unit conversion"], topics: { A: [], B: ["measurement"], C: ["geometry"] } },
    { keys: ["decimal", "desimal"], topics: { A: [], B: [], C: ["decimalsPercent"] } },
    { keys: ["percent", "persen", "percentage"], topics: { A: [], B: [], C: ["decimalsPercent"] } },
    { keys: ["ratio", "perbandingan", "rasio"], topics: { A: [], B: [], C: ["ratio"] } },
    { keys: ["area", "luas"], topics: { A: [], B: ["measurement"], C: ["geometry"] } },
    { keys: ["perimeter", "keliling"], topics: { A: [], B: ["measurement"], C: ["geometry"] } },
    { keys: ["geometry", "geometri", "bangun datar"], topics: { A: [], B: ["measurement"], C: ["geometry"] } },
    { keys: ["vocabulary", "kosakata", "vocab"], topics: { A: ["vocab"], B: ["vocab"], C: ["vocab"] }, subject: "english" },
    { keys: ["grammar", "tata bahasa", "tenses", "past tense"], topics: { A: ["grammar"], B: ["grammar"], C: ["grammar"] }, subject: "english" },
    { keys: ["homophone", "choose the correct word", "choose the word"], topics: { A: ["vocab"], B: ["choose"], C: ["choose"] }, subject: "english" },
    { keys: ["reading", "membaca", "passage", "teks bacaan", "comprehension"], topics: { A: ["reading"], B: ["reading"], C: ["reading"] }, subject: "english" }
  ];

  global.GS_DATA = {
    TOPICS: TOPICS, bandOf: bandOf, NAMES: NAMES, ITEMS: ITEMS, PLACES: PLACES,
    VOCAB: VOCAB, CHOOSE: CHOOSE, VERBS: VERBS, VERB_SCENES: VERB_SCENES,
    PASSAGES: PASSAGES, GRID_KEYWORDS: GRID_KEYWORDS
  };
})(typeof window !== "undefined" ? window : globalThis);
