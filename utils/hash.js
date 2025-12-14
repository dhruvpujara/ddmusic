// controllers/hashtagGenerator.js
class HashtagGenerator {
    constructor() {
        this.apiToken = process.env.HF_TOKEN;
        this.apiEndpoint = "https://router.huggingface.co/v1/chat/completions";
        // Working models (from their documentation):
        this.models = [
            "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
            "google/flan-t5-xxl",
            "meta-llama/Llama-2-7b-chat-hf",
            "microsoft/DialoGPT-medium"
        ];
    }

    async generateHashtags(songName, movieName) {
        try {
            const prompt = `Generate 10-12 relevant hashtags for a Bollywood song titled "${songName}" from the movie "${movieName}". 
            Include hashtags for the song name, movie name, music genre, mood, and trending tags. 
            Format the response as comma-separated hashtags only, like: #SongName #MovieName #Music #Bollywood`;

            const response = await fetch(this.apiEndpoint, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    model: this.models[0], // Use Mistral
                    max_tokens: 100,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log("Hashtag generation response:", result);

            // Extract the assistant's reply
            const reply = result.choices?.[0]?.message?.content || "";

            // Extract hashtags from the reply
            const hashtags = this.extractHashtags(reply);

            return hashtags.length > 0 ? hashtags : this.getFallbackTags(songName, movieName);

        } catch (error) {
            console.error("Hashtag generation error:", error.message);
            return this.getFallbackTags(songName, movieName);
        }
    }

    extractHashtags(text) {
        // Find all hashtags in the text
        const hashtagRegex = /#[\w\u0900-\u097F]+/g;
        const matches = text.match(hashtagRegex) || [];

        // Clean and deduplicate
        const cleaned = matches.map(tag =>
            tag.trim()
        );

        // Return unique hashtags, max 12
        return [...new Set(cleaned)].slice(0, 12);
    }

    getFallbackTags(songName, movieName) {
        // Simple fallback if API fails
        const songSlug = songName.toLowerCase().replace(/[^\w]/g, '');
        const movieSlug = movieName.toLowerCase().replace(/[^\w]/g, '');

        return [
            `#${songSlug}`,
            `#${movieSlug}`,
            '#music',
            '#bollywood',
            '#song',
            '#newsong',
            '#trending',
            '#viral',
            '#hitsong',
            '#indianmusic'
        ];
    }
}

module.exports = new HashtagGenerator();