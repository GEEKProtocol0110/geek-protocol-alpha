import { PrismaClient } from "@prisma/client";
import { GEEK_CATEGORIES } from "@geek/shared";

const prisma = new PrismaClient();

const questions: Array<{
  category: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}> = [
  // Video Games
  {
    category: "Video Games",
    prompt: "What year was the first Super Mario Bros. released?",
    options: ["1983", "1985", "1987", "1989"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Nintendo", "Platform"],
  },
  {
    category: "Video Games",
    prompt: "Which company developed The Witcher 3?",
    options: ["Bethesda", "CD Projekt Red", "FromSoftware", "Rockstar Games"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["RPG", "2010s"],
  },
  {
    category: "Video Games",
    prompt: "What is the name of the AI companion in Half-Life 2?",
    options: ["GLADOS", "HEV", "Alyx Vance", "The G-Man"],
    correctIndex: 2,
    difficulty: "medium",
    tags: ["FPS", "Valve"],
  },
  {
    category: "Video Games",
    prompt: "Which Dark Souls game was developed by FromSoftware and published in 2011?",
    options: ["Dark Souls II", "Dark Souls", "Dark Souls III", "Elden Ring"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["FromSoftware", "Action RPG"],
  },
  {
    category: "Video Games",
    prompt: "What is the primary objective in Minecraft?",
    options: ["Defeat the Ender Dragon", "Build and explore freely", "Complete levels", "Defeat the Wither"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Sandbox", "Survival"],
  },
  {
    category: "Video Games",
    prompt: "In The Legend of Zelda: Ocarina of Time, what is Link's primary childhood companion?",
    options: ["Epona", "Navi", "Midna", "Tatl"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Nintendo", "Adventure"],
  },

  // Sci-Fi & Fantasy
  {
    category: "Sci-Fi & Fantasy",
    prompt: "Who wrote the Harry Potter series?",
    options: ["J.K. Rowling", "J.R.R. Tolkien", "George R.R. Martin", "Terry Pratchett"],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["Literature", "Fantasy"],
  },
  {
    category: "Sci-Fi & Fantasy",
    prompt: "In Star Wars, what is the name of Han Solo's ship?",
    options: ["X-Wing", "Millennium Falcon", "TIE Fighter", "A-Wing"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Movies", "Star Wars"],
  },
  {
    category: "Sci-Fi & Fantasy",
    prompt: "What is the primary element used in Avatar: The Last Airbender for energy and flight?",
    options: ["Firebending", "Earthbending", "Waterbending", "Airbending"],
    correctIndex: 3,
    difficulty: "medium",
    tags: ["Animation", "Fantasy"],
  },
  {
    category: "Sci-Fi & Fantasy",
    prompt: "In The Lord of the Rings, what is the name of Frodo's sword?",
    options: ["Excalibur", "Sting", "Durandal", "Anduril"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Literature", "Fantasy"],
  },
  {
    category: "Sci-Fi & Fantasy",
    prompt: "Who is the author of the Foundation series?",
    options: ["Arthur C. Clarke", "Isaac Asimov", "Philip K. Dick", "Douglas Adams"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Science Fiction", "Literature"],
  },
  {
    category: "Sci-Fi & Fantasy",
    prompt: "In Dune, what is the spice called that extends life and enables space travel?",
    options: ["Melange", "Sandworm", "Arrakis", "Thumper"],
    correctIndex: 0,
    difficulty: "medium",
    tags: ["Science Fiction", "Literature"],
  },

  // Movies & TV
  {
    category: "Movies & TV",
    prompt: "What year was the first Avengers movie released?",
    options: ["2010", "2011", "2012", "2013"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["Marvel", "Movies"],
  },
  {
    category: "Movies & TV",
    prompt: "Who directed the original Blade Runner?",
    options: ["George Lucas", "Ridley Scott", "James Cameron", "Stanley Kubrick"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Sci-Fi", "Movies"],
  },
  {
    category: "Movies & TV",
    prompt: "In Breaking Bad, what alias does Walter White use?",
    options: ["Cook", "Heisenberg", "Mr. White", "Cap'n Cook"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["TV", "Drama"],
  },
  {
    category: "Movies & TV",
    prompt: "How many seasons did Game of Thrones run for?",
    options: ["6", "7", "8", "9"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["TV", "Fantasy"],
  },
  {
    category: "Movies & TV",
    prompt: "Who played the Joker in The Dark Knight?",
    options: ["Jared Leto", "Heath Ledger", "Joaquin Phoenix", "Jack Nicholson"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Movies", "Comic Book"],
  },
  {
    category: "Movies & TV",
    prompt: "What is the name of the coffee shop in Friends?",
    options: ["Grind House", "Coffee Central", "Central Perk", "The Daily Grind"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["TV", "Comedy"],
  },

  // Comics
  {
    category: "Comics",
    prompt: "Who created Spider-Man?",
    options: ["Jack Kirby", "Stan Lee and Steve Ditko", "Todd McFarlane", "George Lucas"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Marvel", "Comics"],
  },
  {
    category: "Comics",
    prompt: "What is Batman's real name?",
    options: ["Bruce Wayne", "Clark Kent", "Peter Parker", "Tony Stark"],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["DC", "Comics"],
  },
  {
    category: "Comics",
    prompt: "What colour is the Incredible Hulk?",
    options: ["Blue", "Green", "Purple", "Red"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Marvel", "Comics"],
  },
  {
    category: "Comics",
    prompt: "Who is Superman's archnemesis?",
    options: ["Joker", "Lex Luthor", "Green Goblin", "Magneto"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["DC", "Comics"],
  },
  {
    category: "Comics",
    prompt: "What is the real name of the Flash (Barry Allen's superhero name)?",
    options: ["Speed Force", "Scarlet Speedster", "The Flash", "Lightning Rod"],
    correctIndex: 2,
    difficulty: "medium",
    tags: ["DC", "Comics"],
  },
  {
    category: "Comics",
    prompt: "Which X-Men member can control magnetism?",
    options: ["Wolverine", "Magneto", "Storm", "Cyclops"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Marvel", "Comics"],
  },

  // Anime & Manga
  {
    category: "Anime & Manga",
    prompt: "What is the main character's name in Naruto?",
    options: ["Sasuke Uchiha", "Kakashi Hatake", "Naruto Uzumaki", "Jiraiya"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["Anime", "Manga"],
  },
  {
    category: "Anime & Manga",
    prompt: "In Attack on Titan, what creatures do the humans fight?",
    options: ["Demons", "Titans", "Dragons", "Monsters"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Anime", "Action"],
  },
  {
    category: "Anime & Manga",
    prompt: "What is the protagonist's goal in One Piece?",
    options: ["Become a Samurai", "Find the One Piece treasure", "Save the World", "Defeat Luffy"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Anime", "Adventure"],
  },
  {
    category: "Anime & Manga",
    prompt: "Who is the main antagonist in Code Geass?",
    options: ["Shirley Fenette", "CC", "Lelouch vi Britannia", "Suzaku Kururugi"],
    correctIndex: 2,
    difficulty: "hard",
    tags: ["Anime", "Drama"],
  },
  {
    category: "Anime & Manga",
    prompt: "In Demon Slayer, what type of power do the slayers use?",
    options: ["Magic", "Breathing Techniques", "Chi Energy", "Chakra"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Anime", "Action"],
  },
  {
    category: "Anime & Manga",
    prompt: "What is the name of Goku's signature technique in Dragon Ball?",
    options: ["Spirit Bomb", "Kamehameha", "Destructo Disc", "Galick Gun"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["Anime", "Action"],
  },

  // Tech & Programming
  {
    category: "Tech & Programming",
    prompt: "What year was Python created?",
    options: ["1989", "1991", "1995", "2000"],
    correctIndex: 1,
    difficulty: "hard",
    tags: ["Programming", "Languages"],
  },
  {
    category: "Tech & Programming",
    prompt: "Who invented the World Wide Web?",
    options: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Linus Torvalds"],
    correctIndex: 2,
    difficulty: "medium",
    tags: ["Tech History", "Web"],
  },
  {
    category: "Tech & Programming",
    prompt: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["Web", "Programming"],
  },
  {
    category: "Tech & Programming",
    prompt: "Which company developed JavaScript?",
    options: ["Microsoft", "Oracle", "Netscape", "Google"],
    correctIndex: 2,
    difficulty: "medium",
    tags: ["Programming", "Web"],
  },
  {
    category: "Tech & Programming",
    prompt: "What does SQL stand for?",
    options: ["Structured Query Language", "Sequential Query Language", "Simple Query Language", "Standard Query Language"],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["Databases", "Programming"],
  },
  {
    category: "Tech & Programming",
    prompt: "In cryptography, what does RSA stand for?",
    options: ["Rivest-Shamir-Adleman", "Run-System-Algorithm", "Rapid-Secure-Access", "Real-System-Architecture"],
    correctIndex: 0,
    difficulty: "hard",
    tags: ["Cryptography", "Security"],
  },

  // History
  {
    category: "History",
    prompt: "In what year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["World History", "War"],
  },
  {
    category: "History",
    prompt: "Who was the first President of the United States?",
    options: ["Thomas Jefferson", "George Washington", "Benjamin Franklin", "John Adams"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["USA History", "Presidents"],
  },
  {
    category: "History",
    prompt: "In what year did the Berlin Wall fall?",
    options: ["1987", "1988", "1989", "1990"],
    correctIndex: 2,
    difficulty: "medium",
    tags: ["Modern History", "Cold War"],
  },
  {
    category: "History",
    prompt: "Which empire built the Great Wall of China?",
    options: ["Han Dynasty", "Ming Dynasty", "Qin Dynasty", "Tang Dynasty"],
    correctIndex: 1,
    difficulty: "medium",
    tags: ["Asian History", "Architecture"],
  },
  {
    category: "History",
    prompt: "Who was Napoleon Bonaparte?",
    options: ["King of France", "Emperor of France", "General of Rome", "Duke of Spain"],
    correctIndex: 1,
    difficulty: "easy",
    tags: ["European History", "Military"],
  },
  {
    category: "History",
    prompt: "In what year did the Titanic sink?",
    options: ["1910", "1911", "1912", "1913"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["Maritime History", "Disasters"],
  },

  // Pop Culture
  {
    category: "Pop Culture",
    prompt: "What year did the first iPhone release?",
    options: ["2005", "2006", "2007", "2008"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["Tech", "Apple"],
  },
  {
    category: "Pop Culture",
    prompt: "Who is the creator of South Park?",
    options: ["Trey Parker and Matt Stone", "Dan Harmon", "Seth MacFarlane", "Mike Judge"],
    correctIndex: 0,
    difficulty: "medium",
    tags: ["Television", "Comedy"],
  },
  {
    category: "Pop Culture",
    prompt: "What is the most streamed song on Spotify of all time?",
    options: ["Blinding Lights", "Shape of You", "Someone You Loved", "Bad Guy"],
    correctIndex: 0,
    difficulty: "hard",
    tags: ["Music", "Streaming"],
  },
  {
    category: "Pop Culture",
    prompt: "Which social media platform was founded by Mark Zuckerberg?",
    options: ["Twitter", "Instagram", "Facebook", "TikTok"],
    correctIndex: 2,
    difficulty: "easy",
    tags: ["Social Media", "Tech"],
  },
  {
    category: "Pop Culture",
    prompt: "What is the name of Taylor Swift's most recent album (as of 2024)?",
    options: ["Folklore", "Evermore", "Midnights", "The Tortured Poets Department"],
    correctIndex: 3,
    difficulty: "hard",
    tags: ["Music", "Pop"],
  },
  {
    category: "Pop Culture",
    prompt: "Which actor played Tony Stark in the Marvel Cinematic Universe?",
    options: ["Robert Downey Jr.", "Chris Evans", "Chris Hemsworth", "Scarlett Johansson"],
    correctIndex: 0,
    difficulty: "easy",
    tags: ["Movies", "Marvel"],
  },
];

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    // Clear existing questions
    const deleted = await prisma.question.deleteMany({});
    console.log(`Deleted ${deleted.count} existing questions`);

    // Insert new questions
    for (const q of questions) {
      await prisma.question.create({
        data: {
          category: q.category,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          difficulty: q.difficulty,
          tags: q.tags,
          active: true,
        },
      });
    }

    console.log(`✅ Seeded ${questions.length} questions across ${GEEK_CATEGORIES.length} categories`);
    console.log(`Categories: ${GEEK_CATEGORIES.join(", ")}`);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
