
export const GROK_API_KEY = process.env.XAI_API_KEY || '';

interface GrokMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GrokResponse {
    choices: {
        message: {
            content: string;
        }
    }[]
}

export class GrokService {
    private baseUrl = 'https://api.x.ai/v1/chat/completions';
    private model = 'grok-beta'; 

    async completion(messages: GrokMessage[]): Promise<string> {
        // Fallback to simulation if no API Key is present in the environment
        if (!GROK_API_KEY) {
            console.warn("Grokify: No XAI_API_KEY found. Using simulation mode.");
            return this.simulateResponse(messages);
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                console.warn(`Grok API Error: ${response.status} ${response.statusText}. Using simulation.`);
                return this.simulateResponse(messages);
            }

            const data = await response.json() as GrokResponse;
            return data.choices[0].message.content;
        } catch (e) {
            console.error("Grok Connection Failed", e);
            return this.simulateResponse(messages);
        }
    }

    async generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
        const content = await this.completion([
            { role: 'system', content: systemPrompt + "\nIMPORTANT: Return ONLY valid JSON, no markdown formatting." },
            { role: 'user', content: userPrompt }
        ]);
        
        // Cleanup markdown fences if present
        const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
        
        try {
            return JSON.parse(cleanJson) as T;
        } catch (e) {
            console.error("Failed to parse Grok JSON:", content);
            // Return empty array or object as fallback based on typical expected structure
            return [] as unknown as T;
        }
    }

    async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
        return this.completion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
    }

    /**
     * Simulation Layer for Demo purposes when API is not reachable
     */
    private simulateResponse(messages: GrokMessage[]): string {
        const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
        const systemMsg = messages[0].content.toLowerCase();

        // Simulate JSON responses
        if (systemMsg.includes('json') || lastUserMsg.includes('json')) {
            // Bulk/Product Optimization
            if (lastUserMsg.includes('products') || lastUserMsg.includes('produkte')) {
                // Extract IDs from prompt if possible, or return generic mock
                return JSON.stringify([
                    {
                        id: 'prod_1',
                        optimizedTitle: 'Alpenluft Premium Zirbenholz Diffuser - Swiss Made',
                        seoTitle: 'Zirbenholz Diffuser kaufen | Original Schweizer Handarbeit',
                        seoDescription: 'Handgefertigter Aroma-Diffuser aus echtem Bündner Zirbenholz. Sorgen Sie für ein natürliches Raumklima. Jetzt online bestellen.',
                        tags: ['wohnen', 'zirbenholz', 'wellness', 'schweiz', 'handarbeit'],
                        googleCategory: '568',
                        identifierExists: true,
                        changesSummary: 'Titel für CTR optimiert, SEO Metadaten ergänzt.'
                    },
                    {
                        id: 'prod_2',
                        optimizedTitle: 'Gletscherwasser Feuchtigkeitscreme - Bio & Vegan',
                        seoTitle: 'Gesichtscreme mit Gletscherwasser | SwissPure Naturkosmetik',
                        seoDescription: 'Belebende Feuchtigkeitspflege mit reinem Schweizer Gletscherwasser. 100% natürlich und vegan. Für alle Hauttypen geeignet.',
                        tags: ['kosmetik', 'gesichtspflege', 'bio', 'vegan', 'swiss made'],
                        googleCategory: '345',
                        identifierExists: false,
                        changesSummary: 'USP "Bio & Vegan" im Titel hervorgehoben.'
                    }
                ]);
            }
            // Auto Categorization
            if (lastUserMsg.includes('kollektionen') || lastUserMsg.includes('collections')) {
                 return JSON.stringify([
                     { product: "Beispiel Produkt 1", collection: "Neuheiten", reason: "Produkt ist neu im Sortiment" },
                     { product: "Beispiel Produkt 2", collection: "Sale", reason: "Preisreduziertes Produkt" }
                 ]);
            }
            // Market Intelligence
            if (lastUserMsg.includes('konkurrenz')) {
                return JSON.stringify({
                    marketPriceAverage: 'CHF 89.90',
                    competitors: [
                        { name: 'Galaxus', price: 'CHF 85.00', status: 'In Stock' },
                        { name: 'Manor', price: 'CHF 95.00', status: 'Low Stock' }
                    ],
                    strategy: 'Premium-Positionierung durch "Swiss Made" Fokus beibehalten.',
                    opportunity: 'Bundle-Angebot mit ätherischen Ölen erstellen.'
                });
            }
             // Reputation
            if (lastUserMsg.includes('kundenbewertungen') || lastUserMsg.includes('review')) {
                return JSON.stringify({
                    sentimentScore: 82,
                    commonIssues: ['Lieferverzögerung', 'Verpackungsmüll'],
                    positiveHighlights: ['Qualität', 'Kundensupport', 'Design'],
                    suggestedReply: 'Vielen Dank für das Feedback. Wir arbeiten bereits an nachhaltigeren Verpackungslösungen...'
                });
            }
             // Media Analysis
            if (lastUserMsg.includes('bild')) {
                return JSON.stringify({
                    qualityScore: 88,
                    altText: "Premium Produktansicht vor neutralem Hintergrund",
                    improvements: ["Ausleuchtung verbessern", "Mehr Kontrast"],
                    technical: "1024x1024px"
                });
            }
            
            // Automation Tasks
            if (lastUserMsg.includes('bundle')) {
                return JSON.stringify({
                    title: "Alpen-Wellness Set Komplett",
                    description: "Das ultimative Entspannungs-Set für Ihr Zuhause.",
                    price: "CHF 169.00",
                    discount: "15%",
                    sku: "BND-ALP-001",
                    tags: ["bundle", "geschenkidee"]
                });
            }
            
            return "[]";
        }

        // Simulate Text responses
        if (lastUserMsg.includes('blog')) {
            return "# Der ultimative Guide zu Zirbenholz\n\n**Autor:** iKteam\n\nZirbenholz ist nicht nur schön anzusehen...";
        }
        if (lastUserMsg.includes('instagram')) {
            return "🌿 Hol dir die Alpen nach Hause! Unser neuer Diffuser ist da. ✨ #SwissMade #InteriorDesign #Zirbenholz";
        }
        if (lastUserMsg.includes('alt-text')) {
             return "Produktansicht von vorne vor weissem Hintergrund";
        }

        return "Grok AI Simulation: Ich habe deine Anfrage erhalten und verarbeitet.";
    }
}

export const grok = new GrokService();
