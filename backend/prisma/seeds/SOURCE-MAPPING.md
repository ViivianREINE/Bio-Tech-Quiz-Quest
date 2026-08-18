# OMICS Unit 1 Content Source Mapping

Authoritative source PDFs:

| File | Scope |
| --- | --- |
| `Unit-1_ii.pdf` | Unit outline, reverse/forward genetics, ABCDE floral model, homeotic genes |
| `Unit-1_i.pdf` | Single-cell sequencing workflow, genomics technologies, isolation methods, challenges |
| `Unit-1-epigenome.pdf` | Epigenetic mechanisms, histone/DNA modifications, epigenetics databases |

## Seeded hierarchy

```
OMICS
└── Unit 1: Functional Genomics and Epigenomics
    ├── Reverse and Forward Genetics          → Unit-1_ii.pdf
    ├── Single-Cell Sequencing Technologies   → Unit-1_i.pdf
    ├── Single-Cell Genomics                  → Unit-1_i.pdf
    ├── Epigenetic Mechanisms of Gene Regulation → Unit-1-epigenome.pdf
    ├── Epigenetics Databases                 → Unit-1-epigenome.pdf
    └── Unit 1 Comprehensive Assessment       → all three PDFs
```

## Topics intentionally omitted

The Unit-1_ii outline mentions **Structural genomics**, **Clinical genomics**, and **cBioPortal**, but the supplied PDF text extracts do not contain substantive academic content for those sections. They were not seeded to avoid hallucinated material.

## Metadata convention

Each `LearningContent.metadata` entry includes:

- `sourceFile`
- `sourceSection`
- `contentPurpose`

Question metadata includes `sourceFile` and `sourceSection`.

## Idempotency keys

- Subject: unique `name = OMICS`
- Unit: unique `(subjectId, unitNumber = 1)`
- Topic: `(unitId, title)`
- Learning content: `(topicId, title)`
- Quiz: `(topicId, title)`
- Question: `(quizId, displayOrder)`
- Option: `(questionId, displayOrder)`
