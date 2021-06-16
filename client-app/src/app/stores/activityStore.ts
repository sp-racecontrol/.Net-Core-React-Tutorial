import { makeAutoObservable, runInAction } from 'mobx'
import agent from '../api/agent';
import { Activity } from '../models/activity'

export default class ActivityStore
{
    activities: Activity[] = [];
    selectedActivity: Activity | undefined = undefined;
    editMode = false;
    loading = false;
    loadingInitial = true;

    constructor()
    {
        makeAutoObservable(this)
    }

    get activitiesByDate()
    {
        return this.activities.slice().sort((a, b) => 
            Date.parse(a.date) - Date.parse(b.date));
    }

    get groupedActivities()
    {
        return Object.entries(
            this.activitiesByDate.reduce((activities, activity) =>
        {
            const date = activity.date;
            activities[date] = activities[date] ? [...activities[date], activity] : [activity];
            return activities;
        }, {} as {[key: string]: Activity[]})
        )
    }

    loadActivities = async () => 
    {       
        this.loadingInitial = true;
        try 
        {
            const activities = await agent.Activities.list();

            runInAction(() => 
            {
                activities.forEach(activity =>
                {
                    this.setActivity(activity);
                })
                this.loadingInitial = false;
            })
        }
        catch (error)
        {
            console.log(error);
            this.setLoadingInitial(false);
        }
    }

    loadActivity = async (id: string) =>
    {
        let activity = this.getActivity(id);
        
        if (activity)
        {
            this.selectedActivity = activity;
            return activity;
        }
        else
        {
            this.loadingInitial = true;

            try 
            {
                activity = await agent.Activities.details(id);
                this.setActivity(activity);
                this.selectedActivity = activity;
                this.setLoadingInitial(false);
                return activity;
            } 
            catch (error) 
            {
                console.log(error);        
                this.setLoadingInitial(false) ;       
            }
        }
    }

    private getActivity = (id: string) =>
    {
        return this.activities.filter(x => x.id === id)[0];
    }

    private setActivity = (activity: Activity) =>
    {
        activity.date = activity.date.split('T')[0];
        this.activities.push(activity);
    }

    setLoadingInitial = (state: boolean) =>
    {
        this.loadingInitial = state;
    }

    createActivity = async (activity: Activity) => 
    {
        this.loading = true;

        try
        {
            await agent.Activities.create(activity);
            runInAction(() => 
            {
                this.activities.push(activity);
                this.selectedActivity = activity;
                this.editMode = false;
                this.loading = false;
            })
        }
        catch (error)
        {
            console.log(error);
            runInAction(() => 
            {
                this.loading = false;
            })
        }
    }

    updateActivity = async (activity: Activity) => 
    {
        this.loading = true;

        try
        {
            await agent.Activities.update(activity);
            runInAction(() => 
            {
                this.activities = [...this.activities.filter(a => a.id !== activity.id), activity];
                this.selectedActivity = activity;
                this.editMode = false;
                this.loading = false;
            })
        }
        catch (error)
        {
            console.log(error);
            runInAction(() => 
            {
                this.loading = false;
            })
        }
    }

    deleteActivity = async (id: string) =>
    {
        this.loading = true;

        try 
        {
            await agent.Activities.delete(id);
            runInAction(() => 
            {
                this.activities = [...this.activities.filter(x => x.id !== id)];
                this.loading = false;
            })
        } 
        catch (error) 
        {
            console.log(error);
            runInAction(() => 
            {
                this.loading = false;
            })
        }
    }
}