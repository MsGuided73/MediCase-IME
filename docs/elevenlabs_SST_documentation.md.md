<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# ElevenLabs Speech-to-Text API Documentation

Based on comprehensive research of ElevenLabs' API capabilities, this report provides detailed information about their Speech-to-Text (STT) services, particularly focusing on their new Scribe v1 model released in February 2025. ElevenLabs positions Scribe as "the world's most accurate ASR model" with industry-leading performance across 99 languages.

## Speech-to-Text API Endpoints

### Primary STT Endpoint

The main Speech-to-Text endpoint for ElevenLabs is:

```
POST https://api.elevenlabs.io/v1/speech-to-text
```

**Required Headers:**

- `xi-api-key: YOUR_API_KEY`
- `Content-Type: multipart/form-data`

**Core Parameters:**

- `model_id`: Must be set to `"scribe_v1"` (currently the only available STT model) [^1]
- `file`: The audio or video file to transcribe [^2]

**Optional Parameters:**

- `diarize`: Boolean to enable speaker diarization [^3]
- `speaker_count`: Number of expected speakers (used with diarization) [^3]
- `language_code`: ISO 639-1 language code (supports automatic detection) [^4]
- `timestamps_granularity`: Can be set to `"word"` or `"character"` for different timestamp precision [^5]
- `tag_audio_events`: Boolean to enable tagging of non-speech events like laughter [^4]


### cURL Example

```bash
curl -X POST "https://api.elevenlabs.io/v1/speech-to-text" \
  -H "xi-api-key: YOUR_API_KEY" \
  -F "model_id=scribe_v1" \
  -F "file=@audio_file.mp3"
```


## Audio File Upload and Processing

### Supported File Formats

ElevenLabs supports a comprehensive range of audio and video formats for STT processing [^6]:

**Audio Formats:**

- MP3, WAV, FLAC, M4A, OGA, OGG, OPUS, WEBA, AAC, AIFF

**Video Formats:**

- MP4, AVI, MKV, MOV, M4V, MPEG, MPG, WEBM, WMV, 3GPP


### File Size and Duration Limits

- **Maximum file size**: 500MB for most operations [^7]
- **Maximum duration**: Varies by feature:
    - Standard transcription: Up to 1 hour per file [^1]
    - With diarization enabled: Limited to 8 minutes [^8]
    - Dubbing API: Recently increased to 1GB and 2.5 hours [^9]


### Processing Capabilities

**Core Features:**

- **Speaker Diarization**: Identifies and labels different speakers in multi-speaker recordings [^4]
- **Word-level Timestamps**: Provides precise timing for each word [^10]
- **Character-level Timestamps**: Even more granular timing information [^5]
- **Audio Event Tagging**: Identifies non-speech events like laughter, applause, background noise [^4]
- **Automatic Language Detection**: Can detect and transcribe in 99 languages without manual specification [^4]


## Real-time Transcription Capabilities

### Current Limitations

**Important Note**: ElevenLabs does not currently offer real-time streaming STT capabilities. The Scribe v1 model is designed for batch processing of audio files [^10]. However, they have indicated that "a low-latency version for real-time applications will be released soon" [^10].

### WebSocket API for TTS (Not STT)

While ElevenLabs offers WebSocket streaming for Text-to-Speech, this is not available for Speech-to-Text [^11]. The WebSocket endpoint is:

```
wss://api.elevenlabs.io/v1/text-to-speech/:voice_id/stream-input
```

This is exclusively for TTS streaming and cannot be used for STT purposes.

## Accuracy and Performance Benchmarks

### Industry-Leading Accuracy

Scribe v1 demonstrates exceptional performance across multiple benchmarks [^10]:

**English Performance:**

- FLEURS benchmark: 3.4% Word Error Rate (WER)
- Common Voice: 5.5% WER
- Outperforms competitors like Deepgram Nova 2 (6.9% WER), Gemini Flash 2 (4.2% WER), and Whisper Large v3 (4.7% WER) [^12]

**Multilingual Support:**

- Supports 99 languages with high accuracy [^4]
- Dramatically reduces errors in traditionally underserved languages like Serbian, Cantonese, and Malayalam [^10]
- Particularly strong performance in medical contexts with 98.7% accuracy on stuttering speech samples [^13]


### Processing Speed

- **Transcription speed**: 41 audio seconds per second [^14]
- **Response time**: Approximately 4.66 seconds for typical parliamentary hearing transcript [^13]
- **Real-time factor**: Over 10x real-time playback speed for batch processing [^15]


## Medical Terminology Support

### Enhanced Accuracy for Healthcare

ElevenLabs' Scribe v1 shows promising results for medical applications [^14]:

- **Medical terminology handling**: Designed to handle complex medical vocabulary
- **Accent adaptation**: Performs well with various accents and speaking patterns
- **Noise resilience**: Advanced noise reduction capabilities for clinical environments
- **Precision requirements**: Achieves accuracy levels suitable for medical documentation


### Healthcare-Specific Considerations

Medical applications require特别注意 [^16]:

- **Pronunciation accuracy**: Critical for drug names and medical procedures
- **Contextual understanding**: Ability to distinguish between similar-sounding medical terms
- **Compliance requirements**: HIPAA-compliant processing available in Enterprise plans [^17]


## Pricing and Usage Limits

### STT Pricing Structure

ElevenLabs uses a credit-based pricing model [^17]:

**STT-Specific Pricing:**

- **Free tier**: 10k credits/month (approximately 12 hours of STT via API) [^1]
- **Starter (\$5/month)**: 30k credits
- **Creator (\$22/month)**: 100k credits
- **Pro (\$99/month)**: 500k credits
- **Scale (\$330/month)**: 2M credits
- **Business (\$1,320/month)**: 11M credits

**Per-hour pricing**: \$0.22 per hour for transcription [^13]

### Concurrency Limits

Different plans offer varying concurrency limits [^18]:


| Plan | Concurrent Requests |
| :-- | :-- |
| Free | 2 |
| Starter | 3 |
| Creator | 5 |
| Pro | 10 |
| Scale | 15 |
| Business | 15 |

## API Authentication and Setup

### Authentication Method

ElevenLabs uses API key authentication with the header:

```
xi-api-key: YOUR_API_KEY
```


### Getting Started

1. **Create Account**: Sign up at elevenlabs.io [^19]
2. **Generate API Key**: Navigate to Profile → API Key section [^19]
3. **Test Connection**: Use the models endpoint to verify connectivity:

```bash
curl 'https://api.elevenlabs.io/v1/models' \
  -H 'xi-api-key: YOUR_API_KEY'
```


## Implementation Recommendations

### For Your Proposed Architecture

**Server-side STT Service:**

- Use the batch processing endpoint for high-quality transcription
- Implement file upload handling for various audio formats
- Consider chunking large files to stay within duration limits

**Hybrid Approach:**

- Use Web Speech API for real-time feedback during recording
- Process final audio files through ElevenLabs for production-quality transcripts
- Implement a queue system for batch processing

**Medical Terminology Enhancement:**

- Leverage Scribe v1's high accuracy for medical terms
- Consider preprocessing audio to improve quality
- Implement post-processing validation for critical medical terminology

**Audio Conversation Logging:**

- Enable speaker diarization for multi-participant conversations
- Use word-level timestamps for precise conversation mapping
- Implement structured storage for transcript metadata


### Technical Integration Example

```python
import requests

def transcribe_audio(file_path, enable_diarization=True):
    url = "https://api.elevenlabs.io/v1/speech-to-text"
    
    headers = {
        "xi-api-key": "YOUR_API_KEY"
    }
    
    files = {
        "file": open(file_path, "rb")
    }
    
    data = {
        "model_id": "scribe_v1",
        "diarize": enable_diarization,
        "tag_audio_events": True,
        "timestamps_granularity": "word"
    }
    
    response = requests.post(url, headers=headers, files=files, data=data)
    return response.json()
```

This comprehensive documentation provides the foundation for implementing your proposed STT service architecture using ElevenLabs' API, with particular attention to the medical terminology requirements and hybrid real-time/batch processing approach you outlined.

<div style="text-align: center">⁂</div>

[^1]: https://www.youtube.com/watch?v=bKrkBBRsRgE

[^2]: https://elevenlabs.io/docs/api-reference/speech-to-text/convert

[^3]: https://www.reddit.com/r/ElevenLabs/comments/1l3v2ee/speech_to_text_api_with_scribev1_diarization/

[^4]: https://elevenlabs.io/docs/product-guides/playground/speech-to-text

[^5]: https://n8n.io/workflows/2245-generate-text-to-speech-using-elevenlabs-via-api/

[^6]: https://help.elevenlabs.io/hc/en-us/articles/25708656270737-Which-file-formats-are-supported-by-Dubbing

[^7]: https://forum.convai.com/t/elevenlabs-clarification/1716

[^8]: https://www.reddit.com/r/ElevenLabs/comments/1iz7xrh/introducing_elevenlabs_scribe_the_most_accurate/

[^9]: https://help.elevenlabs.io/hc/en-us/articles/14312733311761-How-many-requests-can-I-make-and-can-I-increase-it

[^10]: https://elevenlabs.io/blog/meet-scribe

[^11]: https://softcery.com/lab/how-to-choose-stt-tts-for-ai-voice-agents-in-2025-a-comprehensive-guide/

[^12]: https://elevenlabs.io/speech-to-text/english

[^13]: https://elevenlabs.io/blog/scribe-comparison-to-openais-4o-speech-to-text-model

[^14]: https://elevenlabs.io/blog/xaia

[^15]: https://11labs-ai.com/11elevenlabs-speech-to-text/

[^16]: https://discuss.huggingface.co/t/using-the-elevenlabs-api-for-text-to-speech-streaming/33346

[^17]: https://help.elevenlabs.io/hc/en-us/articles/23864324790289-What-is-the-max-input-length-when-using-Voice-Changer

[^18]: https://play.ht/blog/elevenlabs-pricing/

[^19]: https://11labs-ai.com/elevenlabs-api-documentation/

[^20]: https://github.com/CyR1en/ElevenLabsS4TS

[^21]: https://github.com/open-webui/open-webui/issues/14600

[^22]: https://elevenlabs.io/docs/overview

[^23]: https://www.reddit.com/r/shortcuts/comments/1h0vq3c/elevenlabs_text_to_voice_api/

[^24]: https://play.ht/blog/elevenlabs-text-to-speech-voice-api/

[^25]: https://help.elevenlabs.io/hc/en-us/sections/14163158308369-API

[^26]: https://elevenlabs.io/docs/models

[^27]: https://elevenlabs.io/developers

[^28]: https://community.activepieces.com/t/how-to-format-post-for-elevenlabs-api-text-to-speech-api/771

[^29]: https://elevenlabs.io/docs/api-reference/streaming

[^30]: https://elevenlabs.io/blog/new-text-to-speech-endpoints-with-timestamps

[^31]: https://daily.dev/blog/10-best-api-documentation-tools-2024

[^32]: https://elevenlabs.io/speech-to-text

[^33]: https://elevenlabs.io/docs/api-reference/introduction

[^34]: https://elevenlabs.io/docs/capabilities/speech-to-text

[^35]: https://elevenlabs.io/docs/api-reference/text-to-speech/convert

[^36]: https://elevenlabs.io/audio-to-text

[^37]: https://navinspire.ai/RAG/documentation/components/voice-message/elevenlabs-stt

[^38]: https://www.youtube.com/watch?v=CE4iPp7kd7Q

[^39]: https://help.elevenlabs.io/hc/en-us/articles/15754340124305-What-audio-formats-do-you-support

[^40]: https://www.reddit.com/r/ElevenLabs/comments/17zpr03/voicetovoice_in_realtime/

[^41]: https://elevenlabs.io/blog/text-to-speech-vs-speech-to-text

[^42]: https://elevenlabs.io/docs/conversational-ai/overview

[^43]: https://venturebeat.com/ai/elevenlabs-new-speech-to-text-model-scribe-is-here-with-highest-accuracy-rate-so-far-96-7-for-english/

[^44]: https://play.ht/blog/elevenlabs-streaming-api/

[^45]: https://www.segmind.com/models/eleven-labs-transcript/api

[^46]: https://elevenlabs.io/docs/capabilities/text-to-speech

[^47]: https://blog.addpipe.com/transcribing-pipe-recordings-with-elevenlabs-new-speech-to-text-model-scribe/

[^48]: https://docs.pipecat.ai/server/services/tts/elevenlabs

[^49]: https://www.reddit.com/r/ElevenLabs/comments/135yzzq/si_there_anywhere_an_example_how_to_attach_with/

[^50]: https://www.datacamp.com/tutorial/beginners-guide-to-elevenlabs-api

[^51]: https://elevenlabs.io/docs/api-reference/authentication

[^52]: https://elevenlabs.io/docs/quickstart

[^53]: https://zuplo.com/blog/2025/04/16/elevenlabs-api

[^54]: https://11labs-ai.com/elevenlabs-websocket-api-documentation/

[^55]: https://www.reddit.com/r/ElevenLabs/comments/1315lku/is_there_a_way_to_stream_input_text_and_stream/

[^56]: https://www.reddit.com/r/ElevenLabs/comments/1e2erbr/tts_streaming_from_llm/

[^57]: https://stackoverflow.com/questions/76854884/how-to-properly-handle-streaming-audio-coming-from-elevenlabs-streaming-api

[^58]: https://www.incubyte.co/post/voice-technology-in-healthcare-a-comparative-analysis-of-text-to-speech-tts-and-speech-to-text-stt-models

[^59]: https://community.openai.com/t/how-does-elevenlabs-or-deepgram-realtime-voice-agents-work-as-good-as-openai-realtime-api/1083444

[^60]: https://healthtechofftherecord.substack.com/p/elevenlabs-released-a-scribe-will

[^61]: https://www.reddit.com/r/ElevenLabs/comments/1djlkrg/speech_to_speech_streaming_api/

[^62]: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input

[^63]: https://elevenlabs.io/docs/api-reference/text-to-speech/stream

[^64]: https://www.reddit.com/r/ElevenLabs/comments/17pk48h/elevenlabs_vs_openai_api_pricing/

[^65]: https://drdroid.io/integration-diagnosis-knowledge/elevenlabs-rate-limit-exceeded

[^66]: https://blockchain.news/news/elevenlabs-enhances-dubbing-api-file-upload-limits

[^67]: https://websitevoice.com/blog/elevenlabs-pricing-plans/

[^68]: https://drdroid.io/integration-diagnosis-knowledge/elevenlabs-audio-length-exceeds-limit

[^69]: https://www.reddit.com/r/Chub_AI/comments/1bz4xqk/so_each_time_i_use_a_chatbot_that_has_an/

[^70]: https://help.elevenlabs.io/hc/en-us/articles/26446749564049-What-is-the-maximum-size-of-file-I-can-upload-for-Voice-Isolator

[^71]: https://www.youtube.com/watch?v=zbjoe8niUqs

[^72]: https://www.reddit.com/r/ElevenLabs/comments/1gsrgr5/professional_voice_clone_needs_2_hours_of_me/

[^73]: https://elevenlabs.io/pricing/api

[^74]: https://www.reddit.com/r/ElevenLabs/comments/1ev1zxg/why_is_the_monthly_quota_is_like_crumbs/

[^75]: https://news.ycombinator.com/item?id=43426022

[^76]: https://elevenlabs.io/blog/dubbing-api-limit-update

[^77]: https://elevenlabs.io/pricing

