# localhostGPT

A desktop application for running and fine-tuning language models and other AI models. Built on the peer-to-peer architecture of [Tensorlink](https://github.com/smartnodes-lab/tensorlink), `localhostGPT` enables users to access large, personalized models with memory, all while preserving personal data. This application combines cloud-level performance with the ownership and customization of local computing.

Currently under development.

````mermaid
flowchart LR
    title(["localhostGPT Workflows"])
    A[User Input]

    %% Privacy preserved workflow
    subgraph LLM_Portion["LLM (Privacy Preserving)"]
        direction LR

        subgraph LoRA1["LoRA Custom Weights"]
            direction TB
            B["Local Sub Module (Optional, Obfuscates Input)"]
        end

        subgraph LoRA2["LoRA Custom Weights"]
            direction TB
            C[Offloaded Module: Tensorlink P2P Network]
        end

        subgraph LoRA3["LoRA Custom Weights"]
            direction TB
            D["Local Sub Module (Optional, Obfuscates Output)"]
        end
    end

    F[Return Processed Response]

    %% Quick and Dirty public workflow
    subgraph Public["LLM (Public API)"]
        direction LR
        E[Tensorlink API]
    end

    %% Arrows for Privacy Preserved Workflow
    A --> B
    B --> C
    C --> D
    D --> F

    %% Arrows for Quick and Dirty Workflow
    A -.-> E
    E --> F

    %% Styling title
    class title titleClass

    classDef titleClass fill:none,stroke:none,font-weight:bold,font-size:20px,text-align:center;
````
