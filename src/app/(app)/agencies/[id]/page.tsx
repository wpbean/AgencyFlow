import { notFound } from "next/navigation";
import { getAgencyById } from "@/db/queries/agencies";
import { listTemplates } from "@/db/queries/templates";
import { getSettings } from "@/lib/settings";
import { AgencyDetailHeader } from "@/components/agencies/agency-detail-header";
import { OverviewTab } from "@/components/agencies/detail/overview-tab";
import { ContactsTab } from "@/components/agencies/detail/contacts-tab";
import { OutreachTab } from "@/components/agencies/detail/outreach-tab";
import { OpportunitiesTab } from "@/components/agencies/detail/opportunities-tab";
import { ProjectsTab } from "@/components/agencies/detail/projects-tab";
import { ActivityTab } from "@/components/agencies/detail/activity-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [record, templates, settings] = await Promise.all([getAgencyById(id), listTemplates(), getSettings()]);

  if (!record) notFound();

  const { agency, contacts, tags, opportunities, projects, outreach, activities } = record;
  const contactOptions = contacts.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }));

  return (
    <>
      <AgencyDetailHeader agency={agency} contacts={contacts} templates={templates} />
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
            <TabsTrigger value="outreach">Outreach ({outreach.length})</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <OverviewTab agency={agency} tags={tags} />
          </TabsContent>
          <TabsContent value="contacts" className="mt-4">
            <ContactsTab agencyId={agency.id} contacts={contacts} />
          </TabsContent>
          <TabsContent value="outreach" className="mt-4">
            <OutreachTab records={outreach} />
          </TabsContent>
          <TabsContent value="opportunities" className="mt-4">
            <OpportunitiesTab
              agencyId={agency.id}
              opportunities={opportunities}
              contacts={contactOptions}
              defaultCurrency={settings.defaultCurrency}
            />
          </TabsContent>
          <TabsContent value="projects" className="mt-4">
            <ProjectsTab agencyId={agency.id} projects={projects} defaultCurrency={settings.defaultCurrency} />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityTab agencyId={agency.id} activities={activities} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
