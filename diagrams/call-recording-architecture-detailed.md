# Call Recording Architecture — OrecX component detail

Component-level view of the OrecX call recording stack, showing the REST API
path (PC → F5 → OrkUI), the media path (CUCM SIP/SIPREC → OrkAudio), and the
JTAPI / CTI connector in the middle (CUCM CTI Manager → CTI connector → OrkAudio).

> Open `call-recording-architecture.drawio` at [app.diagrams.net](https://app.diagrams.net)
> (Visio substitute; exports `.vsdx`). The Mermaid below renders on GitHub.

```mermaid
flowchart TB
    PHONE["Cisco IP Phone<br/>(BIB enabled)"]
    PC["Agent / Supervisor PC<br/>(browser)"]

    subgraph VOICE["Cisco Voice Platform"]
        CUCM["Cisco Unified CM (CUCM)<br/>SIP / SIPREC recording trunk"]
        CTIMGR["CTI Manager<br/>(on CUCM)"]
    end

    CTIBOX["JTAPI / CTI Connector<br/>(Oreka CTI module)"]

    F5["F5 BIG-IP<br/>VIP / REST API gateway<br/>(HTTPS + SIPREC)"]

    subgraph OREC["Call Recording — OrecX (RHEL 9)"]
        ORKAUDIO["OrkAudio<br/>capture / recording service"]
        ORKUI["OrkUI / OrkWeb<br/>web UI + REST API"]
    end

    QUMULO["Qumulo Cluster<br/>NFS export /recordings"]

    PHONE -- "SCCP/SIP register + calls" --> CUCM
    PC -- "HTTPS / REST API" --> F5
    F5 -- "REST API (HTTPS)" --> ORKUI
    CUCM -- "SIP / SIPREC media (SRTP)" --> ORKAUDIO
    CTIMGR -- "JTAPI (TLS) tcp/2748-2749" --> CTIBOX
    CTIBOX -- "call events / metadata" --> ORKAUDIO
    ORKUI -- "search / playback" --> ORKAUDIO
    ORKAUDIO -- "NFS tcp/2049" --> QUMULO

    classDef cisco fill:#1BA0D7,stroke:#0F6E96,color:#fff
    classDef f5 fill:#E21D38,stroke:#9E1427,color:#fff
    classDef rhel fill:#EE0000,stroke:#A30000,color:#fff
    classDef storage fill:#5C2D91,stroke:#3B1D5E,color:#fff
    classDef app fill:#2E7D32,stroke:#1B5E20,color:#fff
    classDef client fill:#455A64,stroke:#263238,color:#fff
    class CUCM,CTIMGR,PHONE cisco
    class F5 f5
    class ORKAUDIO,ORKUI rhel
    class QUMULO storage
    class CTIBOX app
    class PC client
```

## Connector / flow table

| From | To | Label |
|---|---|---|
| Cisco IP Phone | CUCM | SCCP/SIP register + calls |
| PC | F5 | HTTPS / REST API |
| F5 | OrkUI/OrkWeb | REST API (HTTPS) |
| CUCM | OrkAudio | SIP / SIPREC media (SRTP) |
| CUCM (CTI Manager) | JTAPI/CTI Connector | JTAPI (TLS) 2748-2749 |
| JTAPI/CTI Connector | OrkAudio | call events / metadata |
| OrkUI/OrkWeb | OrkAudio | search / playback |
| OrkAudio | Qumulo | NFS tcp/2049 |

## OrecX (Oreka) components

- **OrkAudio** — capture daemon; receives SIP/SIPREC + RTP, writes audio files.
- **OrkUI / OrkWeb** — web front end and REST API for search and playback.
- **JTAPI / CTI Connector** — talks to CUCM CTI Manager via JTAPI to attach call
  metadata (agent, ANI/DNIS, call ID) to recordings.
