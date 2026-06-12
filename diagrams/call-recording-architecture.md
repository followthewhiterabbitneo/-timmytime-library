# Call Recording Architecture

CUCM Built-In Bridge (BIB) / SIPREC → F5 BIG-IP → OrecX recorders (RHEL 9) → Qumulo NFS,
with a CTI application interfacing CUCM via JTAPI over TLS.

> Visio alternative: open `call-recording-architecture.drawio` in
> [draw.io / diagrams.net](https://app.diagrams.net) (free, browser or desktop;
> imports/exports Visio `.vsdx`). The Mermaid version below renders natively on
> GitHub and lives in the repo as code.

```mermaid
flowchart TB
    subgraph VOICE["Cisco Voice Platform"]
        CUCM["Cisco Unified CM (CUCM)<br/>Recording SIP Trunk (TLS/SRTP)<br/>10.10.10.10"]
        PHONE["Cisco IP Phones<br/>Built-In Bridge (BIB) enabled<br/>VLAN 110 - 10.10.11.0/24"]
        PHONE -- "BIB media fork (SRTP)" --> CUCM
    end

    CTI["CTI Application<br/>JTAPI / CTI Manager over TLS<br/>10.10.12.20"]
    CTI -- "JTAPI (TLS) tcp/2748-2749" --> CUCM

    F5["F5 BIG-IP LTM<br/>VIP 10.10.20.5:5061 (SIPREC)<br/>TLS termination / re-encrypt"]
    CUCM -- "SIPREC (SIP/TLS tcp 5061)<br/>SRS metadata + forked RTP" --> F5

    subgraph REC["Call Recording - OrecX (RHEL 9)"]
        ORECX1["OrecX Oreka Recorder 1<br/>RHEL 9 - 10.10.21.11"]
        ORECX2["OrecX Oreka Recorder 2<br/>RHEL 9 - 10.10.21.12"]
    end

    F5 -- "Pool member (TLS)" --> ORECX1
    F5 -- "Pool member (TLS)" --> ORECX2

    QUMULO["Qumulo Cluster<br/>NFS v3/v4.1 export: /recordings<br/>10.10.30.0/24 (storage VLAN)"]
    ORECX1 -- "NFS mount tcp/2049" --> QUMULO
    ORECX2 -- "NFS mount tcp/2049" --> QUMULO

    classDef cisco fill:#1BA0D7,stroke:#0F6E96,color:#fff
    classDef f5 fill:#E21D38,stroke:#9E1427,color:#fff
    classDef rhel fill:#EE0000,stroke:#A30000,color:#fff
    classDef storage fill:#5C2D91,stroke:#3B1D5E,color:#fff
    classDef app fill:#2E7D32,stroke:#1B5E20,color:#fff
    class CUCM,PHONE cisco
    class F5 f5
    class ORECX1,ORECX2 rhel
    class QUMULO storage
    class CTI app
```

## Asset inventory

| Asset | Role | Protocol / Port | Example IP |
|---|---|---|---|
| Cisco IP Phones (BIB) | Built-In Bridge forks call media for SIPREC | SRTP | 10.10.11.0/24 |
| Cisco Unified CM | Call control + SIPREC recording trunk (SRC) | SIP/TLS 5061, SRTP | 10.10.10.10 |
| CTI Application | Call events / control via CTI Manager | JTAPI over TLS tcp/2748-2749 | 10.10.12.20 |
| F5 BIG-IP LTM | Load balances SIPREC to recorder pool, TLS termination/re-encrypt | SIP/TLS 5061 VIP | 10.10.20.5 |
| OrecX Oreka (×2) | SIPREC Session Recording Server (SRS) on RHEL 9 | SIP/TLS, RTP | 10.10.21.11–.12 |
| Qumulo cluster | NFS storage for recordings (`/recordings` export) | NFS tcp/2049 | 10.10.30.0/24 |

*IP addresses are placeholders — replace with your real addressing.*
