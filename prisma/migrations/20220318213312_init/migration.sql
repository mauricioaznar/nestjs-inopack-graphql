-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "partId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "comment" TEXT,
    "imageUrl" TEXT,
    "partCategoryId" INTEGER NOT NULL,
    "defaultGeneratedQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("partId")
);

-- CreateTable
CREATE TABLE "PartCategory" (
    "partCategoryId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PartCategory_pkey" PRIMARY KEY ("partCategoryId")
);

-- CreateTable
CREATE TABLE "PartAssignment" (
    "parentId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "requiredQuantity" INTEGER NOT NULL,

    CONSTRAINT "PartAssignment_pkey" PRIMARY KEY ("parentId","componentId")
);

-- CreateTable
CREATE TABLE "PartAddition" (
    "id" SERIAL NOT NULL,
    "partId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "PartAddition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartSubtraction" (
    "id" SERIAL NOT NULL,
    "partId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "PartSubtraction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_partCategoryId_fkey" FOREIGN KEY ("partCategoryId") REFERENCES "PartCategory"("partCategoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartAssignment" ADD CONSTRAINT "PartAssignment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Part"("partId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartAssignment" ADD CONSTRAINT "PartAssignment_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Part"("partId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartAddition" ADD CONSTRAINT "PartAddition_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("partId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartSubtraction" ADD CONSTRAINT "PartSubtraction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("partId") ON DELETE RESTRICT ON UPDATE CASCADE;
