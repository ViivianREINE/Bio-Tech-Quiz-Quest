import { ContentType, Difficulty, QuestionType } from '@prisma/client';
import type { SeedTopic } from './helpers.js';

const tf = (correctIsTrue: boolean): Array<{ optionText: string; displayOrder: number; isCorrect: boolean }> => [
  { optionText: 'True', displayOrder: 1, isCorrect: correctIsTrue },
  { optionText: 'False', displayOrder: 2, isCorrect: !correctIsTrue },
];

export const OMICS_UNIT1_TOPICS: SeedTopic[] = [
  {
    title: 'Reverse and Forward Genetics',
    description:
      'Forward and reverse genetic approaches, mutagenesis tools, and floral development genetics from Unit-1_ii.pdf.',
    displayOrder: 1,
    learningContent: [
      {
        title: 'Forward Genetics Tools',
        contentType: ContentType.TEXT,
        displayOrder: 1,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_ii.pdf',
          sourceSection: 'Tools for Forward Genetics',
          contentPurpose: 'concept',
        },
        body: `## Forward Genetics Tools

**Key points**
- Chemical mutagens and radiation mutagenesis (X-rays, UV rays, and γ-radiations) can cause DNA breaks or dimer formation.
- X-rays and γ-rays cause breaks in double-stranded DNA, resulting in large deletions or chromosomal rearrangements.
- Transposon insertional mutagenesis mobilizes transposable elements containing marker gene(s) in the genome; TE insertion can disrupt coding regions or affect intron splicing or gene expression.
- Map-based cloning and massively parallel sequencing are listed among forward genetics approaches in the source material.

**Exam-focused takeaway**
Forward genetics starts from phenotype and works toward the underlying gene.`,
      },
      {
        title: 'Reverse Genetics Approaches',
        contentType: ContentType.TEXT,
        displayOrder: 2,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_ii.pdf',
          sourceSection: 'Reverse genetics',
          contentPurpose: 'concept',
        },
        body: `## Reverse Genetics

**Key points**
- Reverse genetics approaches listed in the source include gene silencing by RNA interference, TILLING, gene editing, and T-DNA insertions.
- **TILLING** (Targeting Induced Local Lesions in Genomes) is a reverse genetic technique suitable for most plants and provides a way to study induced or natural variation in plant and animal genomes.

**Important terminology**
- RNA interference (RNAi)
- TILLING
- T-DNA insertions

**Exam-focused takeaway**
Reverse genetics starts from a known gene and investigates its function.`,
      },
      {
        title: 'ABCDE Model of Flower Development',
        contentType: ContentType.TABLE,
        displayOrder: 3,
        difficulty: Difficulty.HARD,
        metadata: {
          sourceFile: 'Unit-1_ii.pdf',
          sourceSection: 'ABCDE Model of Flower Development',
          contentPurpose: 'comparison',
        },
        body: `| Class | Example genes | Floral organ role (from source) |
| --- | --- | --- |
| A | APETALA1, APETALA2 | Controls sepal development; with class B genes regulates petal formation |
| B | PISTILLATA, APETALA3 | With class C genes mediates stamen development |
| C | AGAMOUS | Determines carpel formation |
| D | SEEDSTICK, SHATTERPROOF | Specify ovule identity |
| E | SEPALLATA (SEP1–SEP4) | Expressed in entire floral meristem and necessary |

The model was developed from *Arabidopsis thaliana* and Snapdragon mutants; most ABCDE genes are MADS-box genes.`,
      },
      {
        title: 'Homeotic Genes and Floral Mutants',
        contentType: ContentType.TEXT,
        displayOrder: 4,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_ii.pdf',
          sourceSection: 'Mutations in Floral Organ Identify Genes',
          contentPurpose: 'terminology',
        },
        body: `## Homeotic Genes

**Concept**
Researchers isolated single-gene mutants with homeotic transformations to understand floral development.

**Key points**
- Homeotic mutations cause cells to develop into normal organs but in an inappropriate position.
- Homeotic genes help determine tissue identity during development.
- Plant homeotic genes include MADS-box genes; Arabidopsis floral homeotic genes were divided into classes A, B, and C in the source material.`,
      },
    ],
    quizzes: [
      {
        title: 'Reverse and Forward Genetics Quiz',
        description: 'Topic quiz on forward/reverse genetics and floral development from Unit-1_ii.pdf.',
        difficulty: Difficulty.MEDIUM,
        duration: 15,
        passingPercentage: 60,
        maximumAttempts: 3,
        negativeMarking: false,
        correctMark: 1,
        incorrectMark: 0,
        unansweredMark: 0,
        randomizeQuestions: true,
        randomizeOptions: true,
        questions: [
          {
            questionText: 'What does TILLING stand for?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 1,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'Reverse genetics' },
            explanation:
              'The source defines TILLING as Targeting Induced Local Lesions in Genomes, a reverse genetic technique suitable for most plants.',
            options: [
              { optionText: 'Targeting Induced Local Lesions in Genomes', displayOrder: 1, isCorrect: true },
              { optionText: 'Transposon Insertion Line Locator in Genomes', displayOrder: 2, isCorrect: false },
              { optionText: 'Tissue Isolation and Library Linking in Genomics', displayOrder: 3, isCorrect: false },
              { optionText: 'Transcriptional Induction of Loci in Nuclear Genomes', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'TILLING is described as suitable for most plants.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 2,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'Reverse genetics' },
            explanation: 'Unit-1_ii.pdf states that TILLING is suitable for most plants.',
            options: tf(true),
          },
          {
            questionText: 'X-rays and γ-rays can cause breaks in double-stranded DNA according to the forward genetics section.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 3,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'Radiation Mutagenesis' },
            explanation:
              'The source states that X-rays and γ-rays cause breaks in double-stranded DNA, resulting in large deletions or chromosomal rearrangements.',
            options: tf(true),
          },
          {
            questionText: 'Homeotic mutations cause cells to develop into normal organs but in an inappropriate position.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 4,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'Homeotic genes' },
            explanation: 'This is the definition of homeotic mutations given in Unit-1_ii.pdf.',
            options: tf(true),
          },
          {
            questionText: 'Which class A genes control sepal development according to the ABCDE model?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 5,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'ABCDE Model' },
            explanation: 'Class A genes APETALA1 and APETALA2 control sepal development in the ABCDE model.',
            options: [
              { optionText: 'APETALA1 and APETALA2', displayOrder: 1, isCorrect: true },
              { optionText: 'PISTILLATA and APETALA3', displayOrder: 2, isCorrect: false },
              { optionText: 'AGAMOUS and SEPALLATA', displayOrder: 3, isCorrect: false },
              { optionText: 'SEEDSTICK and SHATTERPROOF', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'Class C gene AGAMOUS determines the formation of the carpel.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 6,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'ABCDE Model' },
            explanation: 'Unit-1_ii.pdf states class C genes such as AGAMOUS determine carpel formation.',
            options: tf(true),
          },
          {
            questionText: 'Which reverse genetics approach is explicitly listed alongside RNA interference and T-DNA insertions?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 7,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'Reverse genetics' },
            explanation: 'Gene editing is listed among reverse genetics approaches in Unit-1_ii.pdf.',
            options: [
              { optionText: 'Gene editing', displayOrder: 1, isCorrect: true },
              { optionText: 'Map-based cloning', displayOrder: 2, isCorrect: false },
              { optionText: 'Radiation mutagenesis', displayOrder: 3, isCorrect: false },
              { optionText: 'Bulk RNA sequencing', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'Most genes of the ABCDE model are MADS-box genes.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 8,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'ABCDE Model' },
            explanation: 'Unit-1_ii.pdf states that most genes of the ABCDE model are MADS-box genes.',
            options: tf(true),
          },
        ],
      },
    ],
  },
  {
    title: 'Single-Cell Sequencing Technologies',
    description: 'Single-cell sequencing principles, workflow, and applications from Unit-1_i.pdf.',
    displayOrder: 2,
    learningContent: [
      {
        title: 'Single-Cell vs Bulk Sequencing',
        contentType: ContentType.TEXT,
        displayOrder: 1,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_i.pdf',
          sourceSection: 'Introduction',
          contentPurpose: 'concept',
        },
        body: `## Single-Cell vs Bulk Sequencing

**Concept**
Single-cell sequencing sequences one cell at a time to study genome, transcriptome, epigenome, or other molecular characteristics.

**Key points**
- Traditional bulk sequencing averages many cells and cannot analyze cellular heterogeneity in detail.
- Single-cell sequencing was named Method of the Year for 2013 by *Nature* in the source material.
- Single-cell technologies can detect heterogeneity among individual cells, distinguish small numbers of cells, and delineate cell maps.`,
      },
      {
        title: 'Single-Cell Sequencing Workflow',
        contentType: ContentType.FLOWCHART,
        displayOrder: 2,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_i.pdf',
          sourceSection: 'Process of Single-Cell Sequencing',
          contentPurpose: 'process',
        },
        body: `Reference flow (from Unit-1_i.pdf):

1. **Isolation of single cells** → FACS, MACS, LCM, micromanipulation, microfluidics
2. **Extraction and amplification of genetic material**
3. **Library preparation** with cellular barcodes and adapters
4. **Sequencing** (commonly Illumina sequencing-by-synthesis; proton-based and other NGS platforms also mentioned)
5. **Data analysis** in primary, secondary, and tertiary phases`,
      },
      {
        title: 'Cell Isolation Methods Comparison',
        contentType: ContentType.TABLE,
        displayOrder: 3,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_i.pdf',
          sourceSection: 'Isolation of Single Cells',
          contentPurpose: 'comparison',
        },
        body: `| Method | Source-described feature |
| --- | --- |
| FACS | Fluorescence-based separation; effective but requires many starting cells and can reduce viability |
| MACS | Magnetic tagging of surface proteins; fast and scalable but lower purity in complex populations |
| LCM | Laser isolation from tissue sections; preserves morphology but complex and costly |
| Micromanipulation | Precise manual picking; low throughput |`,
      },
      {
        title: 'Advantages and Limitations',
        contentType: ContentType.TEXT,
        displayOrder: 4,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_i.pdf',
          sourceSection: 'Advantages and Limitations',
          contentPurpose: 'comparison',
        },
        body: `## Advantages
- Detects rare cell types missed in bulk sequencing
- Reveals cellular differences within tissues
- Useful in cancer research, immunology, developmental biology, and clinical diagnostics

## Limitations (from source)
- Expensive for large-scale studies
- Isolation can stress cells and alter characteristics
- Higher noise and sparsity compared with bulk sequencing
- Amplification can introduce errors and bias`,
      },
    ],
    quizzes: [
      {
        title: 'Single-Cell Sequencing Quiz',
        description: 'Topic quiz on single-cell sequencing technologies from Unit-1_i.pdf.',
        difficulty: Difficulty.MEDIUM,
        duration: 20,
        passingPercentage: 60,
        maximumAttempts: 3,
        negativeMarking: false,
        correctMark: 1,
        incorrectMark: 0,
        unansweredMark: 0,
        randomizeQuestions: true,
        randomizeOptions: true,
        questions: [
          {
            questionText: 'Traditional bulk sequencing provides an average representation of many cells.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 1,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Bulk vs single-cell' },
            explanation: 'Unit-1_i.pdf states bulk sequencing averages many cells.',
            options: tf(true),
          },
          {
            questionText: 'Single-cell sequencing was named Method of the Year for 2013 by Nature.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 2,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Introduction' },
            explanation: 'This is explicitly stated in Unit-1_i.pdf.',
            options: tf(true),
          },
          {
            questionText: 'Which sequencing platform is described as most commonly used with sequencing-by-synthesis?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 3,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Sequencing' },
            explanation: 'Unit-1_i.pdf identifies Illumina as the most commonly used NGS method for single-cell sequencing.',
            options: [
              { optionText: 'Illumina', displayOrder: 1, isCorrect: true },
              { optionText: 'Sanger capillary sequencing only', displayOrder: 2, isCorrect: false },
              { optionText: 'Pyrosequencing without NGS', displayOrder: 3, isCorrect: false },
              { optionText: 'Microarray hybridization', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'Primary analysis converts raw BCL files into FASTQ files.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 4,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Primary Analysis' },
            explanation: 'Unit-1_i.pdf describes primary analysis converting BCL output to FASTQ files.',
            options: tf(true),
          },
          {
            questionText: 'FACS separates cells based on fluorescence after labeling with fluorescent markers.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 5,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'FACS' },
            explanation: 'FACS uses fluorescent markers and a flow cytometer to separate cells in Unit-1_i.pdf.',
            options: tf(true),
          },
          {
            questionText: 'Which limitation is associated with single-cell sequencing in the source material?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 6,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Limitations' },
            explanation: 'Unit-1_i.pdf lists high cost as a limitation for large-scale studies.',
            options: [
              { optionText: 'It is expensive for large-scale studies', displayOrder: 1, isCorrect: true },
              { optionText: 'It cannot detect any gene expression', displayOrder: 2, isCorrect: false },
              { optionText: 'It eliminates all technical noise', displayOrder: 3, isCorrect: false },
              { optionText: 'It requires no cell isolation step', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'Cellular barcodes help trace sequencing data back to the original cell.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 7,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Library Preparation' },
            explanation: 'Unit-1_i.pdf states barcodes help trace data to original cells and enable multiplexing.',
            options: tf(true),
          },
          {
            questionText: 'Proton-based sequencing detects release of protons during nucleotide incorporation.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.HARD,
            marks: 1,
            displayOrder: 8,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Sequencing' },
            explanation: 'Unit-1_i.pdf describes proton-based sequencing detecting proton release instead of fluorescence.',
            options: tf(true),
          },
        ],
      },
    ],
  },
  {
    title: 'Single-Cell Genomics',
    description: 'Single-cell genomics technologies, applications, and challenges from Unit-1_i.pdf.',
    displayOrder: 3,
    learningContent: [
      {
        title: 'Introduction to Single-Cell Genomics',
        contentType: ContentType.TEXT,
        displayOrder: 1,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_i.pdf',
          sourceSection: 'Introduction of Single-Cell Genomics',
          contentPurpose: 'concept',
        },
        body: `Single-cell genomics uses high-throughput sequencing to examine genome, transcriptome, epigenome, and proteome at the individual cell level. By analyzing discrete cells rather than bulk samples, it avoids averaging effects and reveals cellular heterogeneity within tissues and populations.`,
      },
      {
        title: 'Key Single-Cell Technologies',
        contentType: ContentType.TABLE,
        displayOrder: 2,
        difficulty: Difficulty.HARD,
        metadata: {
          sourceFile: 'Unit-1_i.pdf',
          sourceSection: 'Key Technologies in Single-Cell Genomics',
          contentPurpose: 'comparison',
        },
        body: `| Technology | Source-described purpose |
| --- | --- |
| scRNA-Seq | Profiles transcriptomes of individual cells |
| scDNA-seq | Analyzes mutations, CNVs, and structural variation in individual cells |
| scATAC-seq | Analyzes chromatin accessibility and open regulatory regions |
| Spatial transcriptomics | Combines single-cell transcriptomics with spatial tissue information |`,
      },
      {
        title: 'Challenges in Single-Cell Genomics',
        contentType: ContentType.TEXT,
        displayOrder: 3,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_i.pdf',
          sourceSection: 'Challenges in Single-Cell Genomics',
          contentPurpose: 'key-points',
        },
        body: `**Experimental challenges**
- Cell capture and sample preparation can cause genetic material loss and amplification bias
- Insufficient sequencing depth leads to dropout of low-expressed genes
- Technical noise from contamination or biological heterogeneity

**Data integration challenges**
- High-dimensional multimodal data integration
- Batch effects across experiments
- Sparsity and missing values in scRNA-seq data`,
      },
    ],
    quizzes: [
      {
        title: 'Single-Cell Genomics Quiz',
        description: 'Topic quiz on single-cell genomics from Unit-1_i.pdf.',
        difficulty: Difficulty.MEDIUM,
        duration: 20,
        passingPercentage: 60,
        maximumAttempts: 3,
        negativeMarking: false,
        correctMark: 1,
        incorrectMark: 0,
        unansweredMark: 0,
        randomizeQuestions: true,
        randomizeOptions: true,
        questions: [
          {
            questionText: 'scRNA-Seq profiles the transcriptomes of individual cells.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 1,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'scRNA-Seq' },
            explanation: 'Unit-1_i.pdf defines scRNA-Seq as profiling transcriptomes of individual cells.',
            options: tf(true),
          },
          {
            questionText: 'scDNA-seq is particularly suitable for studying tumor heterogeneity.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 2,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Single-Cell DNA Sequencing' },
            explanation: 'Unit-1_i.pdf states scDNA-seq is particularly suitable for tumor heterogeneity and genetic diseases.',
            options: tf(true),
          },
          {
            questionText: 'scATAC-seq reveals chromatin accessibility in individual cells.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 3,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'scATAC-seq' },
            explanation: 'Unit-1_i.pdf describes scATAC-seq as analyzing chromatin accessibility in individual cells.',
            options: tf(true),
          },
          {
            questionText: 'Which application area of single-cell genomics is explicitly listed for cancer research?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 4,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Application areas' },
            explanation: 'Unit-1_i.pdf lists resolving tumor heterogeneity and immune cells in the tumor microenvironment.',
            options: [
              { optionText: 'Resolving heterogeneity within tumors', displayOrder: 1, isCorrect: true },
              { optionText: 'Replacing all bulk sequencing permanently', displayOrder: 2, isCorrect: false },
              { optionText: 'Eliminating the need for cell isolation', displayOrder: 3, isCorrect: false },
              { optionText: 'Removing all sequencing noise automatically', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'Microfluidic droplet systems encapsulate individual cells in microliter droplets.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 5,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Microfluidic Technologies' },
            explanation: 'Unit-1_i.pdf describes droplet-based systems encapsulating cells in microliter droplets.',
            options: tf(true),
          },
          {
            questionText: 'Technical dropout in scRNA-seq refers to low-expressed genes not being detected.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.HARD,
            marks: 1,
            displayOrder: 6,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Sequencing depth' },
            explanation: 'Unit-1_i.pdf links insufficient depth to dropout of low-expressed genes.',
            options: tf(true),
          },
          {
            questionText: 'Spatial transcriptomics combines gene expression with spatial tissue information.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 7,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Spatial Transcriptomics' },
            explanation: 'Unit-1_i.pdf defines spatial transcriptomics as combining transcriptomics with spatial information.',
            options: tf(true),
          },
          {
            questionText: 'Which tool is mentioned for integrating single-cell transcriptome and epigenomic data?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.HARD,
            marks: 1,
            displayOrder: 8,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Data analysis tools' },
            explanation: 'Unit-1_i.pdf mentions Seurat Label Transfer and LIGER as integration tools.',
            options: [
              { optionText: 'Seurat and LIGER', displayOrder: 1, isCorrect: true },
              { optionText: 'BLAST and ClustalW only', displayOrder: 2, isCorrect: false },
              { optionText: 'PCR and gel electrophoresis', displayOrder: 3, isCorrect: false },
              { optionText: 'Western blotting alone', displayOrder: 4, isCorrect: false },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Epigenetic Mechanisms of Gene Regulation',
    description: 'Epigenetic modifications and gene regulation from Unit-1-epigenome.pdf.',
    displayOrder: 4,
    learningContent: [
      {
        title: 'What is Epigenetic Modification',
        contentType: ContentType.TEXT,
        displayOrder: 1,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1-epigenome.pdf',
          sourceSection: 'What is Epigenetic Modification',
          contentPurpose: 'definition',
        },
        body: `Epigenetic modification regulates gene expression through chromatin structure or chemical modification without changing the DNA sequence. DNA methylation usually leads to gene silencing, while histone acetylation promotes gene transcription. Epigenetics is defined in the source as potentially heritable and reversible changes in gene expression mediated by DNA methylation, histone modifications, or non-coding RNAs without alteration of DNA sequence.`,
      },
      {
        title: 'DNA Methylation and Histone Modifications',
        contentType: ContentType.TABLE,
        displayOrder: 2,
        difficulty: Difficulty.HARD,
        metadata: {
          sourceFile: 'Unit-1-epigenome.pdf',
          sourceSection: 'Main Types of Epigenetic Modification',
          contentPurpose: 'comparison',
        },
        body: `| Modification | Source-described effect |
| --- | --- |
| DNA methylation at CpG islands/promoters | Inhibits transcription factor binding and gene transcription |
| Histone acetylation (e.g., H3/H4 lysine acetylation) | Loosens chromatin and promotes gene expression |
| H3K4 methylation | Generally associated with gene activation |
| H3K9 and H3K27 methylation | Often linked to gene repression |`,
      },
      {
        title: 'Non-Coding RNA and Chromatin Remodeling',
        contentType: ContentType.TEXT,
        displayOrder: 3,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1-epigenome.pdf',
          sourceSection: 'Non-coding RNA modification',
          contentPurpose: 'mechanism',
        },
        body: `Non-coding RNAs such as miRNA, lncRNA, and circRNA regulate gene expression post-transcriptionally or at transcription level. miRNAs are small non-coding RNAs (~22 nucleotides) that can block mRNA translation. Chromatin remodeling changes three-dimensional chromatin structure, often involving ATP-dependent remodeling complexes.`,
      },
    ],
    quizzes: [
      {
        title: 'Epigenetic Mechanisms Quiz',
        description: 'Topic quiz on epigenetic gene regulation from Unit-1-epigenome.pdf.',
        difficulty: Difficulty.MEDIUM,
        duration: 20,
        passingPercentage: 60,
        maximumAttempts: 3,
        negativeMarking: false,
        correctMark: 1,
        incorrectMark: 0,
        unansweredMark: 0,
        randomizeQuestions: true,
        randomizeOptions: true,
        questions: [
          {
            questionText: 'Epigenetic modification changes the DNA sequence itself.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 1,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'Definition' },
            explanation: 'The source defines epigenetics as regulation without alteration of the DNA sequence.',
            options: tf(false),
          },
          {
            questionText: 'DNA methylation usually leads to gene silencing.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 2,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'DNA methylation' },
            explanation: 'Unit-1-epigenome.pdf states DNA methylation usually leads to gene silencing.',
            options: tf(true),
          },
          {
            questionText: 'Histone acetylation promotes gene transcription according to the source.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 3,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'Histone acetylation' },
            explanation: 'Unit-1-epigenome.pdf links histone acetylation with promoted gene transcription.',
            options: tf(true),
          },
          {
            questionText: 'DNA methylation occurs predominantly at CpG dinucleotides/CpG islands in promoter regions.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 4,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'DNA methylation' },
            explanation: 'Unit-1-epigenome.pdf describes methylation at CpGs/CpG islands in promoter regions.',
            options: tf(true),
          },
          {
            questionText: 'Which enzyme family transfers methyl groups to cytosine during DNA methylation?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 5,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'DNMT' },
            explanation: 'Unit-1-epigenome.pdf names DNA methyltransferases (DNMT) as the enzyme family.',
            options: [
              { optionText: 'DNA methyltransferases (DNMT)', displayOrder: 1, isCorrect: true },
              { optionText: 'DNA polymerase only', displayOrder: 2, isCorrect: false },
              { optionText: 'Reverse transcriptase', displayOrder: 3, isCorrect: false },
              { optionText: 'Topoisomerase II exclusively', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'H3K4 trimethylation (H3K4me3) is listed as associated with activation of gene transcription.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.HARD,
            marks: 1,
            displayOrder: 6,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'Histone modifications' },
            explanation: 'Unit-1-epigenome.pdf lists H3K4me3 among activation-associated histone marks.',
            options: tf(true),
          },
          {
            questionText: 'miRNAs are described as small non-coding RNA molecules containing about 22 nucleotides.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 7,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'microRNAs' },
            explanation: 'Unit-1-epigenome.pdf describes miRNAs as ~22 nucleotide non-coding RNAs.',
            options: tf(true),
          },
          {
            questionText: 'Abnormal epigenetic modification is closely related to disease occurrence including cancer.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 8,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'Disease occurrence' },
            explanation: 'Unit-1-epigenome.pdf links abnormal epigenetic modification to cancer and other diseases.',
            options: tf(true),
          },
        ],
      },
    ],
  },
  {
    title: 'Epigenetics Databases',
    description: 'Epigenetics and methylation databases from Unit-1-epigenome.pdf.',
    displayOrder: 5,
    learningContent: [
      {
        title: 'DNA Methylation Databases Overview',
        contentType: ContentType.TABLE,
        displayOrder: 1,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1-epigenome.pdf',
          sourceSection: 'Epigenetic Databases',
          contentPurpose: 'reference',
        },
        body: `| Database | URL (from source) | Source-described focus |
| --- | --- | --- |
| MethDB | http://www.methdb.de | Methylation patterns and spectra across tissues/phenotypes |
| PubMeth | http://www.pubmeth.org | Literature-curated cancer methylation genes |
| MethCancer | http://methycancer.psych.ac.cn | Human DNA methylation and cancer correlations |
| MethSurv | https://biit.cs.ut.ee/methsurv/ | Methylation biomarkers linked to cancer patient survival |
| Blueprint Data Analysis Portal | http://blueprint-data.bsc.es | Reference epigenome for hematopoietic lineages |`,
      },
      {
        title: 'EWAS and m6A Resources',
        contentType: ContentType.TEXT,
        displayOrder: 2,
        difficulty: Difficulty.HARD,
        metadata: {
          sourceFile: 'Unit-1-epigenome.pdf',
          sourceSection: 'eFORGE and m6A databases',
          contentPurpose: 'reference',
        },
        body: `**eFORGE** (http://eforge.cs.ucl.ac.uk/) filters EWAS data to identify cell types relevant to disease by examining overlap with DNase I hypersensitive site reference maps.

**m6A resources mentioned in the source**
- WHISTLE predicts m6A RNA methylation sites
- MeT-DB V2.0 collects m6A-related sequencing datasets
- REPIC aggregates m6A-seq/MeRIP-seq peaks
- m6A2Target catalogs targets of m6A writers, erasers, and readers`,
      },
    ],
    quizzes: [
      {
        title: 'Epigenetics Databases Quiz',
        description: 'Topic quiz on epigenetics databases from Unit-1-epigenome.pdf.',
        difficulty: Difficulty.MEDIUM,
        duration: 15,
        passingPercentage: 60,
        maximumAttempts: 3,
        negativeMarking: false,
        correctMark: 1,
        incorrectMark: 0,
        unansweredMark: 0,
        randomizeQuestions: true,
        randomizeOptions: true,
        questions: [
          {
            questionText: 'What is the URL for MethDB listed in the source material?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 1,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'MethDB' },
            explanation: 'Unit-1-epigenome.pdf lists MethDB at http://www.methdb.de.',
            options: [
              { optionText: 'http://www.methdb.de', displayOrder: 1, isCorrect: true },
              { optionText: 'http://www.pubmeth.org', displayOrder: 2, isCorrect: false },
              { optionText: 'http://methycancer.psych.ac.cn', displayOrder: 3, isCorrect: false },
              { optionText: 'http://eforge.cs.ucl.ac.uk/', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'PubMeth gathers methylation data from literature related to cancer.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 2,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'PubMeth' },
            explanation: 'Unit-1-epigenome.pdf describes PubMeth as gathering cancer-related methylation literature data.',
            options: tf(true),
          },
          {
            questionText: 'MethSurv is designed for exploring methylation biomarkers associated with cancer patient survival.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 3,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'MethSurv' },
            explanation: 'This is the stated purpose of MethSurv in Unit-1-epigenome.pdf.',
            options: tf(true),
          },
          {
            questionText: 'The Blueprint Data Analysis Portal provides a reference epigenome for hematopoietic cell lineages.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 4,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'Blueprint' },
            explanation: 'Unit-1-epigenome.pdf states Blueprint generated a hematopoietic reference epigenome.',
            options: tf(true),
          },
          {
            questionText: 'eFORGE helps filter EWAS data to identify relevant cell types.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 5,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'eFORGE' },
            explanation: 'Unit-1-epigenome.pdf describes eFORGE filtering EWAS data for disease-relevant cell types.',
            options: tf(true),
          },
          {
            questionText: 'Epifactors organizes genes corresponding to proteins involved in epigenetic mechanisms.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.HARD,
            marks: 1,
            displayOrder: 6,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'Epifactors' },
            explanation: 'Unit-1-epigenome.pdf describes Epifactors as organizing epigenetic factor gene functions.',
            options: tf(true),
          },
        ],
      },
    ],
  },
  {
    title: 'Unit 1 Comprehensive Assessment',
    description: 'Integrated Unit 1 assessment drawing from all three OMICS Unit 1 source PDFs.',
    displayOrder: 6,
    learningContent: [
      {
        title: 'Unit 1 Source Map',
        contentType: ContentType.TEXT,
        displayOrder: 1,
        difficulty: Difficulty.MEDIUM,
        metadata: {
          sourceFile: 'Unit-1_ii.pdf',
          sourceSection: 'Unit 1 outline',
          contentPurpose: 'reference',
        },
        body: `Unit 1 in the course outline covers Functional Genomics and Epigenomics including reverse/forward genetics, single-cell technologies, epigenetic mechanisms, and epigenetics databases. This assessment integrates examinable points from Unit-1_i.pdf, Unit-1_ii.pdf, and Unit-1-epigenome.pdf.`,
      },
    ],
    quizzes: [
      {
        title: 'Unit 1 Comprehensive Assessment',
        description: 'Integrated Unit 1 quiz covering genetics, single-cell technologies, and epigenetics.',
        difficulty: Difficulty.HARD,
        duration: 30,
        passingPercentage: 65,
        maximumAttempts: 2,
        negativeMarking: true,
        correctMark: 1,
        incorrectMark: 0.25,
        unansweredMark: 0,
        randomizeQuestions: true,
        randomizeOptions: true,
        questions: [
          {
            questionText: 'Single-cell sequencing helps detect cellular heterogeneity missed by bulk sequencing.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.EASY,
            marks: 1,
            displayOrder: 1,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Introduction' },
            explanation: 'Unit-1_i.pdf contrasts single-cell methods with bulk averaging that loses heterogeneity information.',
            options: tf(true),
          },
          {
            questionText: 'TILLING is a forward genetics technique.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 2,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'Reverse genetics' },
            explanation: 'Unit-1_ii.pdf lists TILLING under reverse genetics, not forward genetics.',
            options: tf(false),
          },
          {
            questionText: 'Class B genes together with class C genes mediate stamen development in the ABCDE model.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 3,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'ABCDE Model' },
            explanation: 'This relationship is stated directly in Unit-1_ii.pdf.',
            options: tf(true),
          },
          {
            questionText: 'Secondary analysis aligns FASTQ sequences to a reference genome or transcriptome.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 4,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'Secondary Analysis' },
            explanation: 'Unit-1_i.pdf describes secondary analysis as alignment, variant detection, and expression profiling.',
            options: tf(true),
          },
          {
            questionText: 'Methylation of CpG islands in promoter regions can hinder transcription factor binding.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 5,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'DNA methylation' },
            explanation: 'Unit-1-epigenome.pdf states methyl groups inhibit transcription factor binding at recognition sites.',
            options: tf(true),
          },
          {
            questionText: 'Which database is described as correlating cancer with DNA methylation and related genes?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 6,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'MethCancer' },
            explanation: 'Unit-1-epigenome.pdf describes MethCancer as correlating cancer with methylation-related genes.',
            options: [
              { optionText: 'MethCancer', displayOrder: 1, isCorrect: true },
              { optionText: 'WHISTLE', displayOrder: 2, isCorrect: false },
              { optionText: 'REPIC only for protein ChIP-seq', displayOrder: 3, isCorrect: false },
              { optionText: 'dbEM for proteomics only', displayOrder: 4, isCorrect: false },
            ],
          },
          {
            questionText: 'MACS uses magnetic particles to tag cell surface proteins for isolation.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 7,
            metadata: { sourceFile: 'Unit-1_i.pdf', sourceSection: 'MACS' },
            explanation: 'Unit-1_i.pdf describes MACS using magnetic particles tagged to surface proteins.',
            options: tf(true),
          },
          {
            questionText: 'Epigenetic modifications can be inherited and passed to future generations according to the source.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 8,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'Definition' },
            explanation: 'Unit-1-epigenome.pdf states these modifications can be inherited and passed on.',
            options: tf(true),
          },
          {
            questionText: 'Transposon insertional mutagenesis can disrupt coding regions or affect gene expression.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.MEDIUM,
            marks: 1,
            displayOrder: 9,
            metadata: { sourceFile: 'Unit-1_ii.pdf', sourceSection: 'Transposon Insertional Mutagenesis' },
            explanation: 'Unit-1_ii.pdf describes both coding disruption and non-coding effects on splicing/expression.',
            options: tf(true),
          },
          {
            questionText: 'iMETHYL integrates DNA methylation, SNP, and RNA expression data from the same subjects.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: Difficulty.HARD,
            marks: 1,
            displayOrder: 10,
            metadata: { sourceFile: 'Unit-1-epigenome.pdf', sourceSection: 'iMETHYL' },
            explanation: 'Unit-1-epigenome.pdf describes iMETHYL as unifying methylation, SNP, and RNA expression datasets.',
            options: tf(true),
          },
        ],
      },
    ],
  },
];
