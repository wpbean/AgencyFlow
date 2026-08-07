import { db, sqlite } from "./index";
import { calculateLeadScore } from "../lib/scoring";
import {
  agencies,
  contacts,
  emailTemplates,
  outreach,
  followUps,
  opportunities,
  projects,
  activities,
  tags,
  agencyTags,
  settings,
  type AgencyStatus,
  type Priority,
} from "./schema";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Clearing existing data...");
  await db.delete(agencyTags);
  await db.delete(activities);
  await db.delete(followUps);
  await db.delete(outreach);
  await db.delete(projects);
  await db.delete(opportunities);
  await db.delete(contacts);
  await db.delete(agencies);
  await db.delete(emailTemplates);
  await db.delete(tags);
  await db.delete(settings);

  console.log("Seeding tags...");
  const tagNames = [
    "WordPress",
    "WooCommerce",
    "Elementor",
    "Divi",
    "Laravel",
    "React",
    "Agency",
    "Ecommerce",
    "Maintenance",
    "Remote",
    "Hiring",
    "High Priority",
  ];
  const tagRows = await db.insert(tags).values(tagNames.map((name) => ({ name }))).returning();
  const tagId = (name: string) => tagRows.find((t) => t.name === name)!.id;

  console.log("Seeding email templates...");
  const templateRows = await db
    .insert(emailTemplates)
    .values([
      {
        name: "WordPress Agency Intro",
        category: "INITIAL_OUTREACH",
        subject: "WordPress/WooCommerce development support for {{agency_name}}",
        body: `Hello {{first_name}},\n\nI noticed that {{agency_name}} builds WordPress and WooCommerce sites for clients. I'm a freelance WordPress/WooCommerce developer and I help agencies like yours handle overflow development work, custom plugin/theme builds, and ongoing maintenance.\n\nWould you be open to a quick chat about how I could support your team on upcoming projects?\n\nBest,\nAlex`,
      },
      {
        name: "Friendly Follow-up #1",
        category: "FOLLOW_UP_1",
        subject: "Re: WordPress/WooCommerce development support",
        body: `Hi {{first_name}},\n\nJust following up on my note below in case it slipped through. I'd love to help {{agency_name}} with any WordPress/WooCommerce work you have coming up.\n\nHappy to share examples of past work if useful.\n\nBest,\nAlex`,
      },
      {
        name: "Value-add Follow-up #2",
        category: "FOLLOW_UP_2",
        subject: "Quick idea for {{agency_name}}",
        body: `Hi {{first_name}},\n\nNo worries if the timing isn't right. I took a quick look at {{website}} and had one or two ideas for improving performance/conversion on the storefront - happy to share them even if we don't end up working together.\n\nWould a short call make sense?\n\nBest,\nAlex`,
      },
      {
        name: "Final Check-in",
        category: "FINAL_FOLLOW_UP",
        subject: "Closing the loop",
        body: `Hi {{first_name}},\n\nI'll stop following up here, but wanted to leave the door open. If a WordPress/WooCommerce project comes up for {{agency_name}} down the line, feel free to reach out anytime.\n\nAll the best,\nAlex`,
      },
      {
        name: "Glad You're Interested",
        category: "INTERESTED",
        subject: "Great to hear from you, {{first_name}}",
        body: `Hi {{first_name}},\n\nThanks for getting back to me! I'd love to learn more about what {{agency_name}} has in mind. Do you have 20 minutes this week for a quick call?\n\nBest,\nAlex`,
      },
      {
        name: "Project Kickoff Discussion",
        category: "PROJECT_DISCUSSION",
        subject: "Next steps for our project",
        body: `Hi {{first_name}},\n\nExcited to get started. Could you share the technical brief and access details when you get a chance? I'll put together a timeline once I've had a look.\n\nBest,\nAlex`,
      },
      {
        name: "General Check-in",
        category: "GENERAL",
        subject: "Checking in",
        body: `Hi {{first_name}},\n\nHope things are going well at {{agency_name}}. Just checking in - let me know if there's anything I can help with.\n\nBest,\nAlex`,
      },
    ])
    .returning();
  const templateId = (name: string) => templateRows.find((t) => t.name === name)!.id;

  type AgencySeed = {
    name: string;
    website: string;
    country: string;
    city: string;
    companySize: string;
    services: string[];
    technologies: string[];
    source: string;
    status: AgencyStatus;
    priority: Priority;
    description: string;
    tags: string[];
    contact: { firstName: string; lastName: string; email: string; jobTitle: string };
    contact2?: { firstName: string; lastName: string; email: string; jobTitle: string };
  };

  const agencySeeds: AgencySeed[] = [
    {
      name: "PixelForge Studio",
      website: "https://pixelforgestudio.de",
      country: "Germany",
      city: "Berlin",
      companySize: "11-50",
      services: ["WordPress", "WooCommerce", "Web Design"],
      technologies: ["PHP", "Elementor", "React"],
      source: "Clutch",
      status: "CLIENT",
      priority: "HIGH",
      description: "Full-service digital agency building WooCommerce storefronts for European retail brands. Remote-friendly, hiring developers.",
      tags: ["WordPress", "WooCommerce", "Ecommerce", "High Priority"],
      contact: { firstName: "Lena", lastName: "Fischer", email: "lena@pixelforgestudio.de", jobTitle: "Founder" },
      contact2: { firstName: "Marco", lastName: "Weber", email: "marco@pixelforgestudio.de", jobTitle: "Project Manager" },
    },
    {
      name: "Nordic Web Collective",
      website: "https://nordicwebcollective.se",
      country: "Sweden",
      city: "Stockholm",
      companySize: "11-50",
      services: ["WordPress", "Web Design", "SEO"],
      technologies: ["PHP", "Divi", "WooCommerce"],
      source: "LinkedIn",
      status: "PROJECT",
      priority: "HIGH",
      description: "Boutique agency serving Nordic ecommerce brands, small/medium team, remote-friendly and actively hiring developers.",
      tags: ["WordPress", "Divi", "Remote", "Hiring"],
      contact: { firstName: "Elin", lastName: "Karlsson", email: "elin@nordicwebcollective.se", jobTitle: "Technical Director" },
    },
    {
      name: "Emerald Digital",
      website: "https://emeralddigital.ie",
      country: "Ireland",
      city: "Dublin",
      companySize: "1-10",
      services: ["WooCommerce", "Web Design"],
      technologies: ["WooCommerce", "PHP"],
      source: "Referral",
      status: "INTERVIEW",
      priority: "HIGH",
      description: "Small Dublin-based agency specializing in WooCommerce builds for hospitality and retail clients.",
      tags: ["WooCommerce", "Ecommerce"],
      contact: { firstName: "Sean", lastName: "Murphy", email: "sean@emeralddigital.ie", jobTitle: "Founder" },
    },
    {
      name: "Delta Commerce Agency",
      website: "https://deltacommerce.nl",
      country: "Netherlands",
      city: "Amsterdam",
      companySize: "11-50",
      services: ["WooCommerce", "Shopify", "Web Design"],
      technologies: ["WooCommerce", "React", "Laravel"],
      source: "Google",
      status: "INTERESTED",
      priority: "MEDIUM",
      description: "Amsterdam agency building ecommerce experiences, looking for developers wanted to join on a contract basis.",
      tags: ["WooCommerce", "Ecommerce", "Hiring"],
      contact: { firstName: "Bram", lastName: "de Vries", email: "bram@deltacommerce.nl", jobTitle: "Project Manager" },
    },
    {
      name: "Polar Byte Agency",
      website: "https://polarbyte.fi",
      country: "Finland",
      city: "Helsinki",
      companySize: "1-10",
      services: ["WordPress", "Maintenance"],
      technologies: ["PHP", "Elementor"],
      source: "Clutch",
      status: "REPLIED",
      priority: "MEDIUM",
      description: "Small Helsinki studio offering WordPress maintenance retainers to local businesses.",
      tags: ["WordPress", "Maintenance", "Remote"],
      contact: { firstName: "Aino", lastName: "Virtanen", email: "aino@polarbyte.fi", jobTitle: "Founder" },
    },
    {
      name: "Fjord Interactive",
      website: "https://fjordinteractive.no",
      country: "Norway",
      city: "Oslo",
      companySize: "11-50",
      services: ["WordPress", "WooCommerce", "Branding"],
      technologies: ["PHP", "WooCommerce"],
      source: "LinkedIn",
      status: "FOLLOW_UP",
      priority: "MEDIUM",
      description: "Full-service branding and web agency with a growing ecommerce practice, remote-friendly team.",
      tags: ["WordPress", "WooCommerce", "Remote"],
      contact: { firstName: "Ingrid", lastName: "Haugen", email: "ingrid@fjordinteractive.no", jobTitle: "Project Manager" },
    },
    {
      name: "Baltic Pixel Works",
      website: "https://balticpixelworks.pl",
      country: "Poland",
      city: "Warsaw",
      companySize: "11-50",
      services: ["WordPress", "Web Design"],
      technologies: ["PHP", "React"],
      source: "Google",
      status: "CONTACTED",
      priority: "LOW",
      description: "Warsaw-based web design studio expanding into WordPress plugin development.",
      tags: ["WordPress"],
      contact: { firstName: "Kasia", lastName: "Nowak", email: "kasia@balticpixelworks.pl", jobTitle: "Founder" },
    },
    {
      name: "Copenhagen Devshop",
      website: "https://copenhagendevshop.dk",
      country: "Denmark",
      city: "Copenhagen",
      companySize: "1-10",
      services: ["WooCommerce", "Maintenance"],
      technologies: ["WooCommerce", "PHP"],
      source: "Clutch",
      status: "QUALIFIED",
      priority: "MEDIUM",
      description: "Small dev shop supporting WooCommerce stores for Danish SMBs.",
      tags: ["WooCommerce", "Maintenance"],
      contact: { firstName: "Mikkel", lastName: "Sorensen", email: "mikkel@copenhagendevshop.dk", jobTitle: "Technical Director" },
    },
    {
      name: "Thames Digital Agency",
      website: "https://thamesdigital.co.uk",
      country: "United Kingdom",
      city: "London",
      companySize: "51-200",
      services: ["WordPress", "WooCommerce", "SEO", "PPC"],
      technologies: ["PHP", "Elementor", "React"],
      source: "Clutch",
      status: "NEW",
      priority: "HIGH",
      description: "Mid-size London agency managing WordPress sites for enterprise clients, actively hiring developers.",
      tags: ["WordPress", "Hiring", "High Priority"],
      contact: { firstName: "Oliver", lastName: "Bennett", email: "oliver@thamesdigital.co.uk", jobTitle: "Head of Development" },
    },
    {
      name: "Loire Web Studio",
      website: "https://loirewebstudio.fr",
      country: "France",
      city: "Lyon",
      companySize: "1-10",
      services: ["Web Design"],
      technologies: ["Laravel"],
      source: "Google",
      status: "NOT_INTERESTED",
      priority: "LOW",
      description: "Custom web development studio, primarily works in Laravel rather than WordPress.",
      tags: ["Agency"],
      contact: { firstName: "Camille", lastName: "Dubois", email: "camille@loirewebstudio.fr", jobTitle: "Founder" },
    },
  ];

  console.log("Seeding agencies + contacts...");
  for (let i = 0; i < agencySeeds.length; i++) {
    const seed = agencySeeds[i];
    const createdAt = daysAgo(45 - i * 3);

    const [agency] = await db
      .insert(agencies)
      .values({
        name: seed.name,
        website: seed.website,
        country: seed.country,
        city: seed.city,
        timezone: null,
        companySize: seed.companySize,
        description: seed.description,
        services: seed.services,
        technologies: seed.technologies,
        source: seed.source,
        status: seed.status,
        priority: seed.priority,
        leadScore: calculateLeadScore({
          services: seed.services,
          technologies: seed.technologies,
          companySize: seed.companySize,
          source: seed.source,
          description: seed.description,
        }),
        notes: null,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    await db.insert(agencyTags).values(seed.tags.map((t) => ({ agencyId: agency.id, tagId: tagId(t) })));

    const [primaryContact] = await db
      .insert(contacts)
      .values({
        agencyId: agency.id,
        firstName: seed.contact.firstName,
        lastName: seed.contact.lastName,
        email: seed.contact.email,
        jobTitle: seed.contact.jobTitle,
        isPrimary: true,
        createdAt,
      })
      .returning();

    if (seed.contact2) {
      await db.insert(contacts).values({
        agencyId: agency.id,
        firstName: seed.contact2.firstName,
        lastName: seed.contact2.lastName,
        email: seed.contact2.email,
        jobTitle: seed.contact2.jobTitle,
        isPrimary: false,
        createdAt,
      });
    }

    await db.insert(activities).values({
      agencyId: agency.id,
      type: "AGENCY_CREATED",
      title: "Agency added",
      createdAt,
    });
    await db.insert(activities).values({
      agencyId: agency.id,
      type: "CONTACT_ADDED",
      title: `Contact added: ${seed.contact.firstName} ${seed.contact.lastName}`,
      createdAt: daysAgo(45 - i * 3 - 1) < createdAt ? createdAt : createdAt,
    });

    // Build an outreach + follow-up history based on how far along the pipeline the agency is.
    const progressed = seed.status !== "NEW" && seed.status !== "QUALIFIED";
    if (progressed) {
      const sentAt = daysAgo(40 - i * 3);
      const [initialOutreach] = await db
        .insert(outreach)
        .values({
          agencyId: agency.id,
          contactId: primaryContact.id,
          templateId: templateId("WordPress Agency Intro"),
          type: "INITIAL",
          subject: `WordPress/WooCommerce development support for ${agency.name}`,
          body: `Hello ${seed.contact.firstName},\n\nI noticed that ${agency.name} works with WordPress/WooCommerce...`,
          status: "SENT",
          sentAt,
          createdAt: sentAt,
        })
        .returning();

      await db.insert(activities).values({
        agencyId: agency.id,
        type: "EMAIL_SENT",
        title: "Initial outreach sent",
        createdAt: sentAt,
      });

      const repliedStatuses = ["REPLIED", "INTERESTED", "INTERVIEW", "TRIAL", "PROJECT", "CLIENT"];
      if (repliedStatuses.includes(seed.status)) {
        const replyAt = daysAgo(35 - i * 3);
        await db.insert(activities).values({
          agencyId: agency.id,
          type: "REPLY_RECEIVED",
          title: "Reply received",
          createdAt: replyAt,
        });

        if (["INTERESTED", "INTERVIEW", "TRIAL", "PROJECT", "CLIENT"].includes(seed.status)) {
          const [opp] = await db
            .insert(opportunities)
            .values({
              agencyId: agency.id,
              contactId: primaryContact.id,
              title: `${seed.services[0]} support for ${agency.name}`,
              description: `Ongoing ${seed.services[0]} development support.`,
              type: "LONG_TERM_CONTRACT",
              stage:
                seed.status === "INTERESTED"
                  ? "INTERESTED"
                  : seed.status === "INTERVIEW"
                    ? "INTERVIEW"
                    : seed.status === "TRIAL"
                      ? "TRIAL"
                      : "WON",
              expectedRate: 45,
              currency: "EUR",
              expectedHours: 60,
              probability: seed.status === "CLIENT" || seed.status === "PROJECT" ? 90 : 50,
              nextAction: seed.status === "INTERVIEW" ? "Prepare for technical interview" : "Follow up after proposal",
              nextActionDate: seed.status === "INTERVIEW" ? daysFromNow(3) : daysFromNow(7),
              createdAt: daysAgo(30 - i * 3),
              updatedAt: daysAgo(20 - i * 3),
            })
            .returning();

          await db.insert(activities).values({
            agencyId: agency.id,
            type: "OPPORTUNITY_CREATED",
            title: `Opportunity created: ${opp.title}`,
            createdAt: daysAgo(30 - i * 3),
          });

          if (seed.status === "PROJECT" || seed.status === "CLIENT") {
            const [project] = await db
              .insert(projects)
              .values({
                agencyId: agency.id,
                opportunityId: opp.id,
                name: `${seed.services[0]} Retainer`,
                description: `Ongoing development retainer for ${agency.name}.`,
                status: seed.status === "CLIENT" ? "ACTIVE" : "ACTIVE",
                startDate: daysAgo(15 - i * 3 < 0 ? 1 : 15 - i * 3),
                hourlyRate: 45,
                currency: "EUR",
                estimatedHours: 40,
                actualHours: seed.status === "CLIENT" ? 120 : 20,
                createdAt: daysAgo(15 - i * 3 < 0 ? 1 : 15 - i * 3),
              })
              .returning();

            await db.insert(activities).values({
              agencyId: agency.id,
              type: "PROJECT_CREATED",
              title: `Project created: ${project.name}`,
              createdAt: project.createdAt,
            });
          }
        }
      }

      // Pending follow-ups for agencies still mid-sequence.
      if (["CONTACTED", "FOLLOW_UP"].includes(seed.status)) {
        const dueOffsets = [-2, 0, 5]; // overdue, today, upcoming - rotate by index
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueOffsets[i % dueOffsets.length]);
        dueDate.setHours(10, 0, 0, 0);

        await db.insert(followUps).values({
          agencyId: agency.id,
          contactId: primaryContact.id,
          outreachId: initialOutreach.id,
          templateId: templateId("Friendly Follow-up #1"),
          type: "FOLLOW_UP_1",
          dueDate,
          status: "PENDING",
          createdAt: sentAt,
        });

        await db.insert(activities).values({
          agencyId: agency.id,
          type: "FOLLOW_UP_SCHEDULED",
          title: "follow up 1 scheduled",
          createdAt: sentAt,
        });
      } else if (repliedStatuses.includes(seed.status)) {
        // Already replied - show a completed follow-up in history.
        await db.insert(followUps).values({
          agencyId: agency.id,
          contactId: primaryContact.id,
          outreachId: initialOutreach.id,
          templateId: templateId("Friendly Follow-up #1"),
          type: "FOLLOW_UP_1",
          dueDate: daysAgo(36 - i * 3),
          status: "COMPLETED",
          completedAt: daysAgo(36 - i * 3),
          createdAt: sentAt,
        });
      }
    }
  }

  console.log("Seeding app settings...");
  await db.insert(settings).values({
    key: "app",
    value: {
      appName: "AgencyFlow",
      defaultCurrency: "EUR",
      defaultCountry: "Germany",
      followUp1Days: 4,
      followUp2Days: 6,
      finalFollowUpDays: 10,
      scoringWeights: {
        wordpress: 20,
        woocommerce: 20,
        smallMediumAgency: 15,
        hiring: 20,
        remoteFriendly: 15,
        specialtyTech: 10,
      },
      defaultTemplateIds: {},
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    sqlite.close();
  });
