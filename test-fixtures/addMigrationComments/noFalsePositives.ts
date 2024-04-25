function indexMembersByProject(members: Member[]): IndexedMembersByProject {
  return members.reduce<IndexedMembersByProject>((acc, member) => {
    for (const project of member.projects) {
      if (!acc.hasOwnProperty(project)) {
        acc[project] = [];
      }
      if (member.user) {
        acc[project].push(member.user);
      }
    }
    return acc;
  }, {});
}
