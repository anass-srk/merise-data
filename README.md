
Ce projet a été développé dans le cadre d'un projet universitaire portant sur l'Ingénierie Dirigée par les Modèles (MDE - Model Driven Engineering). 

## Objectifs du Projet

L'objectif principal était de créer un langage dédié (DSL) pour la modélisation MERISE, offrant :
- Une syntaxe intuitive et proche de la notation MERISE
- Une validation en temps réel des contraintes de modélisation
- Une génération automatique de diagrammes MCD et MLD
- Une conversion automatique vers le SQL

## Architecture

- Parser: Analyse syntaxique du DSL
- Validator: Vérification des contraintes MERISE
- Generator: Production des diagrammes et SQL
- Web UI: Interface utilisateur interactive

## Implémentation Technique

Le projet utilise plusieurs technologies modernes :
- **Langium** pour la création du DSL
- **Monaco Editor** pour l'interface de développement
- **Vite** pour le bundling et le développement



## Installation et Démarrage

```bash
# Installation des dépendances
npm install

# Génération des fichiers Langium
npm run langium:generate

# Construction du projet
npm run build

# Lancer le serveur de développement
npm run dev
```

#Exemple - Système Universitaire

```bash
entity Student {
    primary studentId INTEGER,
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    dateOfBirth DATE,
    enrollmentDate DATE,
    gpa DECIMAL(3,2)
}

entity Professor {
    primary professorId INTEGER,
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    department VARCHAR(100),
    officeNumber VARCHAR(20),
    salary DECIMAL(10,2)
}

entity Course {
    primary courseId INTEGER,
    code VARCHAR(20),
    name VARCHAR(100),
    credits INTEGER,
    maxCapacity INTEGER
}

entity Department {
    primary deptId INTEGER,
    name VARCHAR(100),
    budget DECIMAL(15,2),
    building VARCHAR(50)
}

relation "enrolls" as Enrollment {
    enrollmentDate DATE,
    grade DECIMAL(4,2),
    attendance DECIMAL(5,2)
}

relation "teaches" as Teaching {
    semester VARCHAR(20),
    year INTEGER,
    evaluationScore DECIMAL(3,2)
}

relation "belongs" as DepartmentCourse {}

relation "heads" as DepartmentHead {
    startDate DATE,
    endDate DATE
}

Student 0,N Enrollment
Course 1,N Enrollment
Professor 1,N Teaching
Course 0,N Teaching
Course 1,1 DepartmentCourse
Department 0,N DepartmentCourse
Professor 0,1 DepartmentHead
Department 1,1 DepartmentHead

'''




